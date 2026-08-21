import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import {
  makeImagePrimary,
  removeImage,
} from "@/services/property-image-service";

export const dynamic = "force-dynamic";

type ImageContext =
  RouteContext<"/api/admin/properties/[propertyId]/images/[imageId]">;

/**
 * PATCH /api/admin/properties/{id}/images/{imageId}
 *
 * Marca la imagen como principal. Es `PATCH` y no `PUT` porque cambia un solo
 * atributo del recurso, no lo reemplaza.
 *
 * No admite desmarcar: una propiedad con imágenes siempre tiene portada, y
 * quitarla dejaría la ficha sin nada que enseñar en el catálogo. Para cambiar
 * cuál es, se marca otra.
 */
export async function PATCH(request: Request, context: ImageContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const payload: unknown = await request.json().catch(() => null);

    if (!isPrimaryRequest(payload)) {
      return jsonError(
        "Envía «isPrimary» con valor verdadero.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const { propertyId, imageId } = await context.params;
    const outcome = await makeImagePrimary(propertyId, imageId);

    switch (outcome.status) {
      case "ok":
        return jsonOk({ message: "Imagen principal actualizada." });

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "not-found":
        return jsonError("Imagen no encontrada.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError(
      "PATCH /api/admin/properties/[propertyId]/images/[imageId]",
      error,
    );
  }
}

/**
 * DELETE /api/admin/properties/{id}/images/{imageId}
 *
 * Elimina la imagen de la propiedad y su archivo de Cloudinary
 * (spec.md, sección 20).
 */
export async function DELETE(_request: Request, context: ImageContext) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId, imageId } = await context.params;
    const outcome = await removeImage(propertyId, imageId);

    switch (outcome.status) {
      case "ok":
        return jsonOk({ message: "Imagen eliminada." });

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "not-found":
        return jsonError("Imagen no encontrada.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError(
      "DELETE /api/admin/properties/[propertyId]/images/[imageId]",
      error,
    );
  }
}

function isPrimaryRequest(payload: unknown): boolean {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as { isPrimary?: unknown }).isPrimary === true
  );
}
