import "server-only";

import { IMAGE_LIMITS, type PropertyImageDto } from "@portal/contracts";

import { findAdminPropertyById } from "@/repositories/admin-property-repository";
import {
  countPropertyImages,
  createPropertyImage,
  deletePropertyImage,
  findNextImagePosition,
  findPropertyImage,
  findPropertyImages,
  reorderPropertyImages,
  setPrimaryPropertyImage,
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

export type ImageChangeOutcome =
  | { readonly status: "ok" }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "not-found" };

/**
 * Fija el orden de la galería (spec.md, sección 20).
 *
 * Se exige la lista completa: una parcial dejaría posiciones a medias, y no
 * hay forma de adivinar dónde va lo que falta.
 */
export async function reorderImages(
  propertyId: string,
  imageIds: readonly string[],
): Promise<ImageChangeOutcome> {
  if (!(await findAdminPropertyById(propertyId))) {
    return { status: "not-found" };
  }

  const current = await findPropertyImages(propertyId);
  const currentIds = new Set(current.map((image) => image.id));
  const requested = new Set(imageIds);

  if (requested.size !== imageIds.length) {
    return {
      status: "invalid",
      message: "La lista de imágenes tiene identificadores repetidos.",
    };
  }

  if (
    requested.size !== currentIds.size ||
    imageIds.some((imageId) => !currentIds.has(imageId))
  ) {
    return {
      status: "invalid",
      message:
        "La lista debe contener exactamente las imágenes de la propiedad.",
    };
  }

  await reorderPropertyImages(propertyId, imageIds);

  return { status: "ok" };
}

/** Marca una imagen como portada y desmarca la anterior. */
export async function makeImagePrimary(
  propertyId: string,
  imageId: string,
): Promise<ImageChangeOutcome> {
  if (!(await findAdminPropertyById(propertyId))) {
    return { status: "not-found" };
  }

  if (!(await findPropertyImage(propertyId, imageId))) {
    return { status: "not-found" };
  }

  await setPrimaryPropertyImage(propertyId, imageId);

  return { status: "ok" };
}

/**
 * Elimina una imagen de la propiedad y de Cloudinary (spec.md, sección 20).
 *
 * Primero la fila y después el archivo. Al revés, si lo segundo fallara la
 * ficha mostraría una imagen rota; en este orden lo peor que queda es un
 * archivo que nadie referencia, que cuesta almacenamiento pero no se le
 * aparece a nadie.
 *
 * Por eso el fallo al borrar en Cloudinary no se propaga: para quien
 * administra la imagen ya no está, que es lo que pidió.
 */
export async function removeImage(
  propertyId: string,
  imageId: string,
): Promise<ImageChangeOutcome> {
  if (!(await findAdminPropertyById(propertyId))) {
    return { status: "not-found" };
  }

  const image = await findPropertyImage(propertyId, imageId);

  if (!image) {
    return { status: "not-found" };
  }

  const remaining = (await findPropertyImages(propertyId)).filter(
    (candidate) => candidate.id !== imageId,
  );

  await deletePropertyImage(propertyId, image, remaining[0]?.id ?? null);

  const config = readCloudinaryConfig();

  if (config) {
    const destroyed = await destroyImage(image.publicId, config);

    if (!destroyed) {
      console.error(
        `[cloudinary] Quedó huérfano el recurso ${image.publicId}: la fila ya se eliminó`,
      );
    }
  }

  return { status: "ok" };
}
