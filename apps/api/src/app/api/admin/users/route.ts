import type { AdminUserPageDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { parseAdminUserListQuery } from "@/services/admin-user-query";
import { listAdminUsers } from "@/services/admin-user-service";

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
