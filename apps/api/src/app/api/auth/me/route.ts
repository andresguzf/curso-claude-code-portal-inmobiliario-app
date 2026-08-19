import type { AuthenticatedUserDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import { updateAccount } from "@/services/auth-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 *
 * Devuelve el usuario de la sesión vigente. El rol y el estado de la cuenta
 * se releen de PostgreSQL en cada llamada, así que desactivar a alguien lo
 * deja fuera de inmediato aunque su testigo siga sin caducar.
 */
export async function GET() {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    return jsonOk<AuthenticatedUserDto>(session.user);
  } catch (error) {
    return jsonInternalError("GET /api/auth/me", error);
  }
}

/**
 * PATCH /api/auth/me
 *
 * Actualiza la cuenta de quien tiene la sesión (spec.md, sección 17).
 *
 * Solo nombre, email y contraseña. El rol y el estado de la cuenta no se
 * aceptan aunque lleguen en el cuerpo: cambiarlos es potestad de ADMIN.
 *
 * Una contraseña actual incorrecta responde 400 y no 401: la sesión sigue
 * siendo válida, y un 401 haría creer al cliente que ha caducado.
 */
export async function PATCH(request: Request) {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await updateAccount(session.user.id, payload);

    switch (outcome.status) {
      case "updated":
        return jsonOk<AuthenticatedUserDto>(outcome.user);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "wrong-password":
        return jsonError(
          "La contraseña actual no es correcta.",
          HTTP_STATUS.BAD_REQUEST,
        );

      case "email-taken":
        return jsonError(
          "Ya existe una cuenta con ese email.",
          HTTP_STATUS.CONFLICT,
        );

      case "gone":
        return jsonError(
          "Tu cuenta ya no está disponible.",
          HTTP_STATUS.UNAUTHORIZED,
        );
    }
  } catch (error) {
    return jsonInternalError("PATCH /api/auth/me", error);
  }
}
