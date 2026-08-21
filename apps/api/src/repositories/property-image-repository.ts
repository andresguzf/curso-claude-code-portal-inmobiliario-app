import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Acceso a `property_images`.
 *
 * PostgreSQL guarda solo lo necesario para relacionar y administrar las
 * imágenes; el archivo vive en Cloudinary (spec.md, sección 5).
 */

const imageSelection = {
  id: true,
  url: true,
  publicId: true,
  position: true,
  isPrimary: true,
} as const;

export function countPropertyImages(propertyId: string): Promise<number> {
  return prisma.propertyImage.count({ where: { propertyId } });
}

/**
 * Posición que le toca a la siguiente imagen.
 *
 * Se calcula a partir de la última y no del total: si se elimina una imagen
 * intermedia, contar daría una posición ya ocupada.
 */
export async function findNextImagePosition(
  propertyId: string,
): Promise<number> {
  const last = await prisma.propertyImage.findFirst({
    where: { propertyId },
    orderBy: { position: "desc" },
    select: { position: true },
  });

  return last === null ? 0 : last.position + 1;
}

export function createPropertyImage(image: {
  readonly propertyId: string;
  readonly url: string;
  readonly publicId: string;
  readonly position: number;
  readonly isPrimary: boolean;
}) {
  return prisma.propertyImage.create({
    data: image,
    select: imageSelection,
  });
}

/** Las imágenes de una propiedad, en el orden en que se muestran. */
export function findPropertyImages(propertyId: string) {
  return prisma.propertyImage.findMany({
    where: { propertyId },
    orderBy: { position: "asc" },
    select: imageSelection,
  });
}

/** Una imagen concreta, siempre acotada a su propiedad. */
export function findPropertyImage(propertyId: string, imageId: string) {
  // El `where` lleva las dos claves: sin `propertyId`, conocer el
  // identificador de una imagen bastaría para tocar la de otra propiedad.
  return prisma.propertyImage.findFirst({
    where: { id: imageId, propertyId },
    select: imageSelection,
  });
}

/**
 * Fija el orden a partir de la lista de identificadores.
 *
 * Va en una transacción: a medio hacer dejaría dos imágenes compartiendo
 * posición, y el orden de la galería pasaría a depender del azar.
 */
export function reorderPropertyImages(
  propertyId: string,
  imageIds: readonly string[],
): Promise<unknown> {
  return prisma.$transaction(
    imageIds.map((imageId, position) =>
      prisma.propertyImage.updateMany({
        where: { id: imageId, propertyId },
        data: { position },
      }),
    ),
  );
}

/**
 * Marca una imagen como principal y desmarca las demás.
 *
 * La unicidad de «una sola principal por propiedad» la sostiene esta
 * transacción: PostgreSQL la expresaría con un índice único parcial, que
 * Prisma Migrate todavía no modela (schema.prisma).
 */
export function setPrimaryPropertyImage(
  propertyId: string,
  imageId: string,
): Promise<unknown> {
  return prisma.$transaction([
    prisma.propertyImage.updateMany({
      where: { propertyId, isPrimary: true },
      data: { isPrimary: false },
    }),
    prisma.propertyImage.updateMany({
      where: { propertyId, id: imageId },
      data: { isPrimary: true },
    }),
  ]);
}

/**
 * Elimina la fila y, si hacía de portada, asciende a la siguiente.
 *
 * Ambas cosas van juntas: una propiedad con imágenes siempre tiene una
 * principal, o dejaría de pintarse en el catálogo.
 *
 * El archivo de Cloudinary lo borra el servicio, después de esto.
 */
export function deletePropertyImage(
  propertyId: string,
  image: { readonly id: string; readonly isPrimary: boolean },
  nextPrimaryId: string | null,
): Promise<unknown> {
  const operations = [
    prisma.propertyImage.deleteMany({
      where: { id: image.id, propertyId },
    }),
  ];

  if (image.isPrimary && nextPrimaryId !== null) {
    operations.push(
      prisma.propertyImage.updateMany({
        where: { id: nextPrimaryId, propertyId },
        data: { isPrimary: true },
      }),
    );
  }

  return prisma.$transaction(operations);
}
