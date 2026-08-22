import { createRateLimiter, readClientAddress } from "@/lib/rate-limit";

/**
 * Límites de la autenticación (spec.md, sección 24b).
 *
 * Viven en un módulo propio, y no dentro de cada Route Handler, porque el
 * estado debe ser único: un limitador creado dentro del handler nacería de
 * nuevo en cada petición y no contaría nada.
 *
 * Sobre el login hay **dos** contadores, porque protegen de cosas distintas.
 */

/**
 * Contador fino: por origen **y cuenta**.
 *
 * Va por cuenta y no solo por IP por una razón concreta: una IP no es una
 * máquina. Detrás de un NAT —una oficina, un edificio, un operador móvil—
 * salen muchas personas por la misma dirección, y contar solo por IP hace que
 * quien teclea mal su contraseña deje fuera a todos sus compañeros,
 * administración incluida.
 *
 * Cinco es holgado para quien se equivoca y nada para quien prueba.
 */
export const loginRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 5 * 60 * 1000,
});

/**
 * Contador grueso: por origen a secas.
 *
 * El fino, solo, se esquiva: basta cambiar de correo en cada intento para
 * estrenar contador. Y cada intento cuesta un scrypt de 16 MiB **aunque el
 * correo no exista**, porque se deriva un hash de descarte para no delatar
 * qué cuentas hay. Sin este tope, rotar correos agota memoria y CPU.
 *
 * Veinte fallos en cinco minutos desde una misma dirección ya es mucho para
 * una oficina y poco para un programa: es el punto donde deja de parecer
 * gente equivocándose.
 */
export const loginFloodLimiter = createRateLimiter({
  limit: 20,
  windowMs: 5 * 60 * 1000,
});

/**
 * Aquí cuentan todos los intentos, con o sin éxito: lo que se limita es dar
 * de alta cuentas en serie, y una que se crea sin problemas es justo el caso
 * que interesa frenar. No hace falta clave por cuenta, porque la cuenta
 * todavía no existe.
 */
export const registerRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

/**
 * Clave del contador fino.
 *
 * El correo se normaliza para que `Maria@…` y `maria@…` compartan contador:
 * si no, alternar mayúsculas estrenaría ventana en cada intento.
 *
 * Un cuerpo sin correo legible se agrupa aparte. Esas peticiones acaban en un
 * 400 de todos modos, y darle a cada una su propio contador sería regalar
 * intentos a quien envía basura.
 */
export function buildLoginKey(origin: string, payload: unknown): string {
  return `${origin}|${readAccount(payload)}`;
}

function readAccount(payload: unknown): string {
  if (typeof payload !== "object" || payload === null) {
    return "sin-cuenta";
  }

  const { email } = payload as { email?: unknown };

  if (typeof email !== "string") {
    return "sin-cuenta";
  }

  const normalizado = email.trim().toLowerCase();

  return normalizado === "" ? "sin-cuenta" : normalizado;
}

export { readClientAddress };
