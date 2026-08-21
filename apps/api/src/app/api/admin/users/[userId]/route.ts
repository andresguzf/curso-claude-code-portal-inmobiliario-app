import type { AdminUserDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import {
  getAdminUser,
  updateUserAsAdministrator,
} from "@/services/admin-user-service";

export const dynamic = "force-dynamic";

type UserContext = RouteContext<"/api/admin/users/[userId]">;

/** GET /api/admin/users/{id} */
export async function GET(_request: Request, context: UserContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { userId } = await context.params;
    const user = await getAdminUser(userId);

    if (!user) {
      return jsonError("Usuario no encontrado.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk<AdminUserDto>(user);
  } catch (error) {
    return jsonInternalError("GET /api/admin/users/[userId]", error);
  }
}

/**
 * PATCH /api/admin/users/{id}
 *
 * Cambia nombre, email, contraseña, rol o estado. Lo que no viaja no se toca.
 *
 * Quién hace la petición sale de la sesión, nunca del cuerpo: es lo que hace
 * imposible saltarse las reglas que protegen la propia cuenta diciendo ser
 * otra persona.
 */
export async function PATCH(request: Request, context: UserContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { userId } = await context.params;
    const payload: unknown = await request.json().catch(() => null);
    const outcome = await updateUserAsAdministrator(
      session.user.id,
      userId,
      payload,
    );

    switch (outcome.status) {
      case "ok":
        return jsonOk<AdminUserDto>(outcome.user);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "forbidden":
        // 403 y no 400: la petición está bien formada; lo que no se permite
        // es que esta persona la haga sobre sí misma.
        return jsonError(outcome.message, HTTP_STATUS.FORBIDDEN);

      case "duplicate":
        return jsonError(outcome.message, HTTP_STATUS.CONFLICT);

      case "not-found":
        return jsonError("Usuario no encontrado.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError("PATCH /api/admin/users/[userId]", error);
  }
}
