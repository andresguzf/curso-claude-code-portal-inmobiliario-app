import type { AdminFeatureDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { changeFeatureName, removeFeature } from "@/services/feature-service";

export const dynamic = "force-dynamic";

type FeatureContext = RouteContext<"/api/admin/features/[featureId]">;

/**
 * PATCH /api/admin/features/{id}
 *
 * Cambia el nombre visible. Es `PATCH` y no `PUT` porque no reemplaza el
 * recurso: el `slug` se queda como estaba, ya que es con lo que las
 * propiedades se conectan y corregir una errata no debe romper esas
 * referencias.
 */
export async function PATCH(request: Request, context: FeatureContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { featureId } = await context.params;
    const payload: unknown = await request.json().catch(() => null);
    const outcome = await changeFeatureName(featureId, payload);

    switch (outcome.status) {
      case "ok":
        return jsonOk<AdminFeatureDto>(outcome.feature);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "duplicate":
        return jsonError(outcome.message, HTTP_STATUS.CONFLICT);

      case "not-found":
        return jsonError(
          "Característica no encontrada.",
          HTTP_STATUS.NOT_FOUND,
        );
    }
  } catch (error) {
    return jsonInternalError("PATCH /api/admin/features/[featureId]", error);
  }
}

/**
 * DELETE /api/admin/features/{id}
 *
 * La elimina y, con ella, la declaran las propiedades que la tenían. No es
 * un borrado lógico como el de las propiedades: aquí no hay ningún contacto
 * comercial que preservar, y una característica retirada no debe seguir
 * ofreciéndose en el formulario.
 */
export async function DELETE(_request: Request, context: FeatureContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { featureId } = await context.params;
    const outcome = await removeFeature(featureId);

    if (outcome.status === "not-found") {
      return jsonError("Característica no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk({ message: "Característica eliminada." });
  } catch (error) {
    return jsonInternalError("DELETE /api/admin/features/[featureId]", error);
  }
}
