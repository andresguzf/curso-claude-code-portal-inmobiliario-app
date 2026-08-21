import type { AdminUserDto, AdminUserPageDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { parseAdminUserListQuery } from "@/services/admin-user-query";
import {
  createUserAsAdministrator,
  listAdminUsers,
} from "@/services/admin-user-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/users
 *
 * Listado de cuentas, con búsqueda por nombre o email y filtros por rol y
 * estado (spec.md, sección 21). Un parámetro inválido produce un 400 en lugar
 * de ignorarse.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const parsed = parseAdminUserListQuery(new URL(request.url).searchParams);

    if (!parsed.ok) {
      return jsonError(parsed.message, HTTP_STATUS.BAD_REQUEST);
    }

    return jsonOk<AdminUserPageDto>(await listAdminUsers(parsed.query));
  } catch (error) {
    return jsonInternalError("GET /api/admin/users", error);
  }
}

/**
 * POST /api/admin/users
 *
 * Da de alta una cuenta con la contraseña inicial que se le fije, y con el
 * rol que se pida (spec.md, sección 21). Es la única vía dentro de la
 * aplicación para crear un segundo ADMIN: el registro público solo crea
 * cuentas `USER`.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await createUserAsAdministrator(payload);

    switch (outcome.status) {
      case "ok":
        return jsonOk<AdminUserDto>(outcome.user, HTTP_STATUS.CREATED);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "duplicate":
        return jsonError(outcome.message, HTTP_STATUS.CONFLICT);

      case "forbidden":
        return jsonError(outcome.message, HTTP_STATUS.FORBIDDEN);

      case "not-found":
        return jsonError("Usuario no encontrado.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError("POST /api/admin/users", error);
  }
}
