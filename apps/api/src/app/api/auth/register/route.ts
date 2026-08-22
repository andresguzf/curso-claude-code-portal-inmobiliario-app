import type { AuthenticatedUserDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
  jsonTooManyRequests,
} from "@/lib/api-response";
import { readClientAddress, registerRateLimiter } from "@/lib/auth-rate-limit";
import {
  buildSessionCookieOptions,
  createSessionToken,
  SESSION_COOKIE_NAME,
} from "@/lib/session";
import { registerUser } from "@/services/auth-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/register
 *
 * Crea una cuenta con rol USER y deja la sesión iniciada, para que quien
 * acaba de registrarse no tenga que escribir sus credenciales otra vez.
 */
export async function POST(request: Request) {
  try {
    const attempt = registerRateLimiter.record(
      readClientAddress(request.headers),
    );

    if (!attempt.allowed) {
      return jsonTooManyRequests(attempt.retryAfterSeconds);
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await registerUser(payload);

    switch (outcome.status) {
      case "created": {
        const response = jsonOk<AuthenticatedUserDto>(
          outcome.user,
          HTTP_STATUS.CREATED,
        );

        response.cookies.set(
          SESSION_COOKIE_NAME,
          await createSessionToken(outcome.user.id),
          buildSessionCookieOptions(),
        );

        return response;
      }

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "email-taken":
        return jsonError(
          "Ya existe una cuenta con ese email.",
          HTTP_STATUS.CONFLICT,
        );
    }
  } catch (error) {
    return jsonInternalError("POST /api/auth/register", error);
  }
}
