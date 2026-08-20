import type { AdminPropertyDto, AdminPropertyPageDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import {
  createAdminProperty,
  listAdminProperties,
} from "@/services/admin-property-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/properties?search=&page=
 *
 * Listado completo, borradores incluidos. Es lo contrario del catálogo
 * público, que solo expone lo publicado: aquí se administra todo.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const parameters = new URL(request.url).searchParams;

    return jsonOk<AdminPropertyPageDto>(
      await listAdminProperties({
        search: parameters.get("search") ?? "",
        page: Number(parameters.get("page")) || 1,
      }),
    );
  } catch (error) {
    return jsonInternalError("GET /api/admin/properties", error);
  }
}

/**
 * POST /api/admin/properties
 *
 * Crea una propiedad. Nace despublicada salvo que se indique lo contrario:
 * es preferible que algo a medio escribir no aparezca en el portal a que
 * aparezca por omisión.
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await createAdminProperty(payload);

    if (outcome.status === "invalid") {
      return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);
    }

    if (outcome.status === "not-found") {
      return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk<AdminPropertyDto>(outcome.property, HTTP_STATUS.CREATED);
  } catch (error) {
    return jsonInternalError("POST /api/admin/properties", error);
  }
}
