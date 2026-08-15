import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Acceso a la tabla `properties`.
 *
 * Esta capa solo consulta PostgreSQL. No decide qué puede ver un visitante:
 * esa regla vive en la capa de servicios (plan.md, sección 8).
 */

export type PropertyQueryFilter = {
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

export function findProperties(filter: PropertyQueryFilter) {
  return prisma.property.findMany({
    where: filter,
    orderBy: { createdAt: "desc" },
    include: summarySelection,
  });
}

export function findPropertyById(id: string, filter: PropertyQueryFilter) {
  return prisma.property.findFirst({
    where: { id, ...filter },
    include: detailSelection,
  });
}
