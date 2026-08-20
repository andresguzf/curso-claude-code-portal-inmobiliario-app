import type { AdminPropertyDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import {
  deleteAdminProperty,
  getAdminProperty,
  updateAdminProperty,
} from "@/services/admin-property-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/properties/{id}
 *
 * Devuelve la propiedad, esté publicada o no: es lo que se carga en el
 * formulario de edición.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/admin/properties/[propertyId]">,
) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const property = await getAdminProperty(propertyId);

    if (!property) {
      return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk<AdminPropertyDto>(property);
  } catch (error) {
    return jsonInternalError("GET /api/admin/properties/[propertyId]", error);
  }
}

/**
 * PUT /api/admin/properties/{id}
 *
 * Reemplaza la propiedad entera, incluidas sus características: quien envía
 * el formulario manda la lista definitiva.
 */
export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/properties/[propertyId]">,
) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const payload: unknown = await request.json().catch(() => null);
    const outcome = await updateAdminProperty(propertyId, payload);

    switch (outcome.status) {
      case "ok":
        return jsonOk<AdminPropertyDto>(outcome.property);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "not-found":
        return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError("PUT /api/admin/properties/[propertyId]", error);
  }
}

/**
 * DELETE /api/admin/properties/{id}
 *
 * Elimina la propiedad y, en cascada, sus imágenes, sus favoritos y sus
 * consultas. Para retirarla del catálogo sin perder nada está despublicarla.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/admin/properties/[propertyId]">,
) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const outcome = await deleteAdminProperty(propertyId);

    if (outcome.status === "not-found") {
      return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk({ message: "Propiedad eliminada." });
  } catch (error) {
    return jsonInternalError(
      "DELETE /api/admin/properties/[propertyId]",
      error,
    );
  }
}
