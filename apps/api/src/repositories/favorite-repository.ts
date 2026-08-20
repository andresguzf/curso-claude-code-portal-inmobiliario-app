import "server-only";

import { prisma } from "@/lib/prisma";
import { PUBLIC_PROPERTY_SCOPE } from "@/repositories/property-scope";

/**
 * Acceso a la tabla `favorites`.
 *
 * La unicidad de `(userId, propertyId)` la garantiza el esquema, no esta
 * capa: dos peticiones simultáneas para la misma propiedad no pueden crear
 * dos filas por mucho que se solapen.
 */

/** Solo el catálogo público puede guardarse (spec.md, sección 8). */
const PUBLISHED = PUBLIC_PROPERTY_SCOPE;

/** Imagen principal para las tarjetas, igual que en el catálogo. */
const summarySelection = {
  images: { where: { isPrimary: true }, take: 1 },
} as const;

/**
 * Propiedades guardadas, de la más reciente a la más antigua.
 *
 * Se consulta desde `favorites` y no desde `properties` porque el orden que
 * importa es el de cuándo las guardó esta persona, no nada de la propiedad.
 * Es además el índice que declara el esquema: `(userId, createdAt)`.
 */
export async function findFavoriteProperties(userId: string) {
  const favorites = await prisma.favorite.findMany({
    where: { userId, property: PUBLISHED },
    orderBy: { createdAt: "desc" },
    include: { property: { include: summarySelection } },
  });

  return favorites.map((favorite) => favorite.property);
}

/** Identificadores guardados, para saber qué tarjetas pintar marcadas. */
export async function findFavoritePropertyIds(
  userId: string,
): Promise<string[]> {
  const favorites = await prisma.favorite.findMany({
    where: { userId },
    select: { propertyId: true },
  });

  return favorites.map((favorite) => favorite.propertyId);
}

export function findPublishedPropertyId(propertyId: string) {
  return prisma.property.findFirst({
    where: { id: propertyId, ...PUBLISHED },
    select: { id: true },
  });
}

/**
 * Guarda una propiedad.
 *
 * `skipDuplicates` hace la operación idempotente: repetirla no crea una
 * segunda fila ni falla, que es lo que necesita un botón que se puede pulsar
 * dos veces seguidas.
 */
export async function createFavorite(
  userId: string,
  propertyId: string,
): Promise<void> {
  await prisma.favorite.createMany({
    data: [{ userId, propertyId }],
    skipDuplicates: true,
  });
}

export async function deleteFavorite(
  userId: string,
  propertyId: string,
): Promise<void> {
  await prisma.favorite.deleteMany({ where: { userId, propertyId } });
}
