import { createRateLimiter, readClientAddress } from "@/lib/rate-limit";

/**
 * Límites de la autenticación (spec.md, sección 24b).
 *
 * Viven en un módulo propio, y no dentro de cada Route Handler, porque el
 * estado debe ser único: un limitador creado dentro del handler nacería de
 * nuevo en cada petición y no contaría nada.
 *
 * Los dos números salen de la misma pregunta: cuántos intentos hace una
 * persona que se equivoca, frente a cuántos hace un programa que prueba.
 * Cinco contraseñas en cinco minutos es holgado para lo primero y nada para
 * lo segundo.
 */

/**
 * Cinco intentos por ventana.
 *
 * Solo cuentan los fallidos: entrar bien vacía el contador, así que quien se
 * equivocó cuatro veces y acertó a la quinta vuelve a empezar con cinco.
 */
export const loginRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 5 * 60 * 1000,
});

/**
 * Aquí cuentan todos, con o sin éxito: lo que se limita es dar de alta
 * cuentas en serie, y una que se crea sin problemas es justo el caso que
 * interesa frenar.
 */
export const registerRateLimiter = createRateLimiter({
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

export { readClientAddress };
