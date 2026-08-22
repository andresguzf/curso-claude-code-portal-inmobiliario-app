/**
 * Límite de intentos por origen (spec.md, sección 24b).
 *
 * Sin él, probar contraseñas contra `/api/auth/login` sale gratis. Y no solo
 * es cuestión de adivinarlas: cada intento obliga al servidor a derivar un
 * scrypt de 16 MiB, así que un chorro de peticiones agota memoria y CPU
 * aunque ninguna contraseña sea correcta.
 *
 * El recuento vive en memoria del proceso. Con varias instancias cada una
 * lleva la suya, de modo que el límite efectivo se multiplica por el número
 * de instancias: lo relaja, no lo anula. Un almacén compartido —Redis o la
 * propia base— es la evolución natural cuando haya más de un proceso, y por
 * eso la interfaz es la misma que tendría entonces.
 *
 * Es una ventana fija y no deslizante: al cambiar de ventana el contador se
 * pone a cero de golpe, así que en el peor caso caben dos ventanas seguidas
 * de intentos. A cambio, cada origen ocupa un número y una fecha.
 */

export type RateLimitDecision =
  | { readonly allowed: true; readonly remaining: number }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

export type RateLimiter = {
  /**
   * ¿Se admite otro intento? No anota nada.
   *
   * Consultar y anotar están separados para que «solo cuentan los intentos
   * fallidos» se cumpla literalmente: se consulta antes de trabajar y se
   * anota después, cuando ya se sabe si el intento falló. Con una sola
   * operación había que anotar a ciegas y deshacerlo al acertar, que es lo
   * mismo escrito peor.
   */
  readonly check: (key: string) => RateLimitDecision;
  /** Anota un intento fallido. */
  readonly record: (key: string) => RateLimitDecision;
  /** Olvida los intentos de un origen: se usa tras autenticar con éxito. */
  readonly reset: (key: string) => void;
  /**
   * Cuántas ventanas hay vivas.
   *
   * Es lo único que deja comprobar desde fuera que las caducadas se
   * descartan. Sin esto, una fuga de memoria solo se notaría en producción.
   */
  readonly size: () => number;
};

type Window = { count: number; expiresAt: number };

/**
 * `now` es un parámetro para poder probar el paso del tiempo sin esperarlo.
 */
export function createRateLimiter(options: {
  readonly limit: number;
  readonly windowMs: number;
  readonly now?: () => number;
}): RateLimiter {
  const { limit, windowMs, now = Date.now } = options;
  const windows = new Map<string, Window>();

  /**
   * Descarta las ventanas caducadas.
   *
   * Sin esto el mapa crecería con una entrada por cada dirección que haya
   * llamado alguna vez, que es una fuga de memoria lenta pero segura.
   */
  function prune(currentTime: number): void {
    for (const [key, window] of windows) {
      if (window.expiresAt <= currentTime) {
        windows.delete(key);
      }
    }
  }

  /** Cuántos quedan en la ventana viva, sin tocarla. */
  function restantes(key: string, currentTime: number): number {
    const existing = windows.get(key);

    if (!existing || existing.expiresAt <= currentTime) {
      return limit;
    }

    return Math.max(0, limit - existing.count);
  }

  function esperaHasta(expiresAt: number, currentTime: number): number {
    // Hacia arriba: redondear hacia abajo devolvería 0 en el último segundo,
    // y quien reintentara al instante volvería a chocar.
    return Math.max(1, Math.ceil((expiresAt - currentTime) / 1000));
  }

  return {
    check(key: string): RateLimitDecision {
      const currentTime = now();
      const quedan = restantes(key, currentTime);

      if (quedan > 0) {
        return { allowed: true, remaining: quedan };
      }

      const existing = windows.get(key);

      return {
        allowed: false,
        retryAfterSeconds: esperaHasta(
          existing?.expiresAt ?? currentTime,
          currentTime,
        ),
      };
    },

    record(key: string): RateLimitDecision {
      const currentTime = now();
      const existing = windows.get(key);

      if (!existing || existing.expiresAt <= currentTime) {
        prune(currentTime);
        windows.set(key, { count: 1, expiresAt: currentTime + windowMs });

        return { allowed: true, remaining: limit - 1 };
      }

      if (existing.count >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: esperaHasta(existing.expiresAt, currentTime),
        };
      }

      existing.count += 1;

      return { allowed: true, remaining: limit - existing.count };
    },

    reset(key: string): void {
      windows.delete(key);
    },

    size(): number {
      return windows.size;
    },
  };
}

/**
 * Origen de la petición.
 *
 * `x-forwarded-for` lo escribe el proxy, y quien llama al backend
 * directamente puede inventárselo. No se pretende que sea infalsificable:
 * esto encarece el ataque más común —un chorro desde una máquina— sin
 * pretender detener a quien rote direcciones. La barrera que no se falsifica
 * es el coste de scrypt.
 *
 * Se toma la primera dirección de la lista, que es la del cliente original:
 * cada proxy añade la suya al final.
 */
export function readClientAddress(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");

  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();

    if (first) {
      return first;
    }
  }

  return headers.get("x-real-ip")?.trim() || "desconocido";
}
