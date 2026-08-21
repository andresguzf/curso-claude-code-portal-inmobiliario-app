import type {
  PropertyImageDto,
  PropertyImageOrderDto,
} from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import {
  addPropertyImage,
  reorderImages,
} from "@/services/property-image-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/properties/{id}/images
 *
 * Sube una imagen y la asocia a la propiedad (spec.md, sección 5). El cuerpo
 * es `multipart/form-data` con un campo `file`, porque lo que viaja es un
 * archivo y no un JSON.
 *
 * El archivo pasa por aquí camino de Cloudinary en vez de ir directo desde
 * el navegador: la firma exige el secreto de la cuenta, y ese secreto no
 * sale del servidor.
 */
export async function POST(
  request: Request,
  context: RouteContext<"/api/admin/properties/[propertyId]/images">,
) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const form = await request.formData().catch(() => null);

    if (!form) {
      return jsonError(
        "Envía la imagen como multipart/form-data.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const file = form.get("file");

    if (!(file instanceof File)) {
      return jsonError(
        "Falta el archivo en el campo «file».",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const outcome = await addPropertyImage(propertyId, file);

    switch (outcome.status) {
      case "ok":
        return jsonOk<PropertyImageDto>(outcome.image, HTTP_STATUS.CREATED);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "too-large":
        return jsonError(outcome.message, HTTP_STATUS.PAYLOAD_TOO_LARGE);

      case "not-found":
        return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);

      case "not-configured":
        return jsonError(
          "La subida de imágenes no está configurada en este entorno.",
          HTTP_STATUS.SERVICE_UNAVAILABLE,
        );

      case "upload-failed":
        return jsonError(
          "No pudimos subir la imagen. Vuelve a intentarlo en unos minutos.",
          HTTP_STATUS.BAD_GATEWAY,
        );
    }
  } catch (error) {
    return jsonInternalError(
      "POST /api/admin/properties/[propertyId]/images",
      error,
    );
  }
}

/**
 * PUT /api/admin/properties/{id}/images
 *
 * Fija el orden de la galería. El cuerpo lleva la lista **completa** de
 * identificadores en el orden deseado, igual que el `PUT` de la propiedad
 * lleva la lista definitiva de características: una parcial dejaría
 * posiciones a medias.
 */
export async function PUT(
  request: Request,
  context: RouteContext<"/api/admin/properties/[propertyId]/images">,
) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const payload: unknown = await request.json().catch(() => null);
    const imageIds = readImageIds(payload);

    if (imageIds === null) {
      return jsonError(
        "Envía «imageIds» con los identificadores en el orden deseado.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const outcome = await reorderImages(propertyId, imageIds);

    switch (outcome.status) {
      case "ok":
        return jsonOk({ message: "Orden actualizado." });

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "not-found":
        return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError(
      "PUT /api/admin/properties/[propertyId]/images",
      error,
    );
  }
}

/** Devuelve `null` si el cuerpo no trae una lista de textos. */
function readImageIds(payload: unknown): readonly string[] | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const { imageIds } = payload as Partial<PropertyImageOrderDto>;

  if (!Array.isArray(imageIds)) {
    return null;
  }

  return imageIds.every((imageId) => typeof imageId === "string" && imageId)
    ? imageIds
    : null;
}
