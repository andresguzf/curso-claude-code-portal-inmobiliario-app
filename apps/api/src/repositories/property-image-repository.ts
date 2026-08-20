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
