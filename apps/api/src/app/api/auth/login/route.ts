import type { AuthenticatedUserDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/api-response";
import { loginRateLimiter, readClientAddress } from "@/lib/auth-rate-limit";
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
    const attempt = loginRateLimiter.record(origin);

    if (!attempt.allowed) {
      // Se corta antes de leer el cuerpo y antes de derivar el scrypt: si el
      // rechazo costara lo mismo que un intento normal, el límite frenaría
      // las conjeturas pero no el consumo, que es la mitad del problema.
      return jsonTooManyRequests(attempt.retryAfterSeconds);
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await loginUser(payload);

    switch (outcome.status) {
      case "authenticated": {
        // Quien acierta no ha gastado cupo: el límite persigue a quien
        // prueba, no a quien tecleó mal su contraseña un par de veces.
        loginRateLimiter.reset(origin);

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
