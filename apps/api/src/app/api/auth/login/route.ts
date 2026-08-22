import type { AuthenticatedUserDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/api-response";
import {
  buildLoginKey,
  loginFloodLimiter,
  loginRateLimiter,
  readClientAddress,
} from "@/lib/auth-rate-limit";
import {
  buildSessionCookieOptions,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import { loginUser } from "@/services/auth-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login
 *
 * Credenciales incorrectas y cuenta desactivada responden lo mismo, y a
 * propósito: un mensaje distinto confirmaría que ese correo tiene cuenta.
 */
export async function POST(request: Request) {
  try {
    const origin = readClientAddress(request.headers);

    // Primero el tope grueso, que no necesita el cuerpo: si el rechazo
    // costara lo mismo que un intento normal, el límite frenaría las
    // conjeturas pero no el consumo, que es la mitad del problema.
    const flood = loginFloodLimiter.check(origin);

    if (!flood.allowed) {
      return jsonTooManyRequests(flood.retryAfterSeconds);
    }

    const payload: unknown = await request.json().catch(() => null);
    // El contador fino necesita saber de qué cuenta se trata, así que va
    // después de leer el cuerpo. Sigue estando antes del scrypt, que es lo
    // caro; leer un JSON pequeño no lo es.
    const accountKey = buildLoginKey(origin, payload);
    const attempt = loginRateLimiter.check(accountKey);

    if (!attempt.allowed) {
      return jsonTooManyRequests(attempt.retryAfterSeconds);
    }

    const outcome = await loginUser(payload);

    if (outcome.status === "rejected") {
      // Solo los fallos gastan cupo, y por eso se anotan aquí y no antes:
      // cuando ya se sabe que el intento no valía.
      loginFloodLimiter.record(origin);
      loginRateLimiter.record(accountKey);
    }

    switch (outcome.status) {
      case "authenticated": {
        // Acertar limpia los dos contadores de este origen: quien demuestra
        // saber su contraseña no es de quien había que defenderse, y sus
        // fallos anteriores no deben pesar sobre nadie más de su oficina.
        loginRateLimiter.reset(accountKey);
        loginFloodLimiter.reset(origin);

        const response = jsonOk<AuthenticatedUserDto>(outcome.user);

        response.cookies.set(
          SESSION_COOKIE_NAME,
          await createSessionToken(outcome.user.id),
          buildSessionCookieOptions(),
        );

        return response;
      }

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "rejected":
        return jsonError(
          "Email o contraseña incorrectos.",
          HTTP_STATUS.UNAUTHORIZED,
        );
    }
  } catch (error) {
    return jsonInternalError("POST /api/auth/login", error);
  }
}
