import "server-only";

import type { PropertyListQuery } from "@portal/contracts";

import { prisma } from "@/lib/prisma";
import {
  buildPropertyOrderBy,
  buildPropertyWhere,
} from "@/services/property-query";

/**
 * Acceso a la tabla `properties`.
 *
 * Esta capa solo consulta PostgreSQL. No decide qué puede ver un visitante:
 * esa regla vive en la capa de servicios (plan.md, sección 8).
 */

export type PropertyScope = {
  readonly isPublished?: boolean;
};

/** Imagen principal para las tarjetas del catálogo. */
const summarySelection = {
  images: {
    where: { isPrimary: true },
    take: 1,
  },
} as const;

/** Galería completa y características para el detalle. */
const detailSelection = {
  images: { orderBy: { position: "asc" } },
  features: true,
} as const;

export function findProperties(query: PropertyListQuery, scope: PropertyScope) {
  return prisma.property.findMany({
    where: buildPropertyWhere(query, scope),
    // El ordenamiento se resuelve en PostgreSQL (plan.md, sección 9).
    orderBy: [...buildPropertyOrderBy(query.sort)],
    include: summarySelection,
  });
}

export function findPropertyById(id: string, scope: PropertyScope) {
  return prisma.property.findFirst({
    where: { id, ...buildPropertyWhere({}, scope) },
    include: detailSelection,
  });
}

/**
 * Valores distintos de ubicación, para poblar los filtros.
 *
 * Se resuelve con tres `DISTINCT` en PostgreSQL en lugar de traer el
 * catálogo completo y deduplicar en memoria (plan.md, sección 9).
 */
export async function findLocationValues(scope: PropertyScope) {
  const where = buildPropertyWhere({}, scope);

  const [communes, cities, regions] = await Promise.all([
    prisma.property.findMany({
      where,
      distinct: ["commune"],
      select: { commune: true },
      orderBy: { commune: "asc" },
    }),
    prisma.property.findMany({
      where,
      distinct: ["city"],
      select: { city: true },
      orderBy: { city: "asc" },
    }),
    prisma.property.findMany({
      where,
      distinct: ["region"],
      select: { region: true },
      orderBy: { region: "asc" },
    }),
  ]);

  return {
    communes: communes.map((row) => row.commune),
    cities: cities.map((row) => row.city),
    regions: regions.map((row) => row.region),
  };
}
