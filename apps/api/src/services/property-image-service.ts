import "server-only";

import { IMAGE_LIMITS, type PropertyImageDto } from "@portal/contracts";

import { findAdminPropertyById } from "@/repositories/admin-property-repository";
import {
  countPropertyImages,
  createPropertyImage,
  findNextImagePosition,
} from "@/repositories/property-image-repository";
import {
  destroyImage,
  readCloudinaryConfig,
  uploadImage,
} from "@/services/cloudinary";
import { validateImageFile } from "@/services/image-validation";

/**
 * Alta de imágenes de una propiedad (spec.md, sección 5).
 *
 * El orden importa: primero se comprueba que la propiedad existe y que el
 * archivo vale, y solo entonces se sube. Al revés, un archivo rechazado
 * habría gastado igualmente una subida.
 */

export type ImageUploadOutcome =
  | { readonly status: "ok"; readonly image: PropertyImageDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "too-large"; readonly message: string }
  | { readonly status: "not-found" }
  | { readonly status: "not-configured" }
  | { readonly status: "upload-failed" };

export async function addPropertyImage(
  propertyId: string,
  file: File,
): Promise<ImageUploadOutcome> {
  const property = await findAdminPropertyById(propertyId);

  if (!property) {
    return { status: "not-found" };
  }

  const validation = validateImageFile(file);

  if (!validation.ok) {
    return {
      status: validation.isTooLarge ? "too-large" : "invalid",
      message: validation.message,
    };
  }

  if (
    (await countPropertyImages(propertyId)) >= IMAGE_LIMITS.maxImagesPerProperty
  ) {
    return {
      status: "invalid",
      message: `Una propiedad admite ${IMAGE_LIMITS.maxImagesPerProperty} imágenes como máximo. Elimina alguna para subir otra.`,
    };
  }

  // Se lee antes de subir: sin credenciales la respuesta es «esta función no
  // está configurada», que no es lo mismo que «Cloudinary falló».
  const config = readCloudinaryConfig();

  if (!config) {
    return { status: "not-configured" };
  }

  const uploaded = await uploadImage(file, config);

  if (!uploaded) {
    return { status: "upload-failed" };
  }

  const position = await findNextImagePosition(propertyId);

  try {
    const image = await createPropertyImage({
      propertyId,
      url: uploaded.url,
      publicId: uploaded.publicId,
      // La primera imagen que se sube es la principal: una propiedad sin
      // portada no se pintaría en el catálogo.
      isPrimary: position === 0,
      position,
    });

    return { status: "ok", image };
  } catch (error) {
    // La fila no se guardó, así que nada apunta al archivo recién subido.
    // Dejarlo allí sería un huérfano que nadie sabría que sobra.
    await destroyImage(uploaded.publicId, config);

    throw error;
  }
}
