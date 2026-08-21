import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Acceso a `features`.
 *
 * La tabla es el vocabulario de características del portal: las propiedades
 * se conectan a sus filas, no guardan texto libre. Por eso el formulario
 * ofrece opciones y no un campo abierto.
 */

const featureSelection = {
  id: true,
  name: true,
  slug: true,
  // Cuántas propiedades la usan. Es lo que permite advertir, antes de
  // eliminarla, a cuántas fichas va a afectar.
  _count: { select: { properties: true } },
} as const;

export function findAllFeatures() {
  return prisma.feature.findMany({
    orderBy: { name: "asc" },
    select: featureSelection,
  });
}

export function findFeatureById(id: string) {
  return prisma.feature.findUnique({ where: { id }, select: featureSelection });
}

/**
 * Busca por nombre o por identificador, ignorando mayúsculas en el nombre.
 *
 * Sirve para rechazar un duplicado con un mensaje claro en lugar de dejar
 * que reviente la restricción de unicidad de PostgreSQL con un 500.
 */
export function findFeatureByNameOrSlug(name: string, slug: string) {
  return prisma.feature.findFirst({
    where: {
      OR: [{ name: { equals: name, mode: "insensitive" } }, { slug }],
    },
    select: featureSelection,
  });
}

export function createFeature(feature: {
  readonly name: string;
  readonly slug: string;
}) {
  return prisma.feature.create({ data: feature, select: featureSelection });
}

/**
 * Renombra una característica.
 *
 * El `slug` **no** cambia: es el identificador estable con el que se conectan
 * las propiedades, y moverlo rompería cualquier referencia guardada. Corregir
 * una errata en el nombre no debería tener esa consecuencia.
 */
export function renameFeature(id: string, name: string) {
  return prisma.feature.update({
    where: { id },
    data: { name },
    select: featureSelection,
  });
}

/**
 * Elimina una característica.
 *
 * Prisma retira de paso las asociaciones con las propiedades que la tenían.
 * Las propiedades no pierden ningún otro dato: dejan de declarar esa
 * característica, nada más.
 */
export function deleteFeature(id: string) {
  return prisma.feature.delete({ where: { id }, select: { id: true } });
}

/**
 * De entre los identificadores pedidos, los que existen.
 *
 * Sirve para rechazar con un 400 lo que si no reventaría al conectar: Prisma
 * lanza al no encontrar la fila, y eso llegaría como un 500 sin explicación.
 */
export async function findExistingFeatureSlugs(
  slugs: readonly string[],
): Promise<string[]> {
  if (slugs.length === 0) {
    return [];
  }

  const features = await prisma.feature.findMany({
    where: { slug: { in: [...slugs] } },
    select: { slug: true },
  });

  return features.map((feature) => feature.slug);
}
