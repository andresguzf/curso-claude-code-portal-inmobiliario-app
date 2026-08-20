import "server-only";

import { OperationType } from "@portal/contracts";

import { prisma } from "@/lib/prisma";

/**
 * Recuentos para el panel de administración.
 *
 * Se piden a la vez porque son independientes entre sí: en serie, el panel
 * tardaría la suma de las seis consultas en lugar de la más lenta.
 *
 * Se cuenta en PostgreSQL y no trayendo filas para medirlas en memoria: el
 * coste de un `count` no crece con el tamaño del catálogo del mismo modo.
 */
export async function countOverview() {
  const [
    totalProperties,
    publishedProperties,
    propertiesForSale,
    propertiesForRent,
    users,
    inquiries,
  ] = await Promise.all([
    prisma.property.count(),
    prisma.property.count({ where: { isPublished: true } }),
    prisma.property.count({ where: { operationType: OperationType.SALE } }),
    prisma.property.count({ where: { operationType: OperationType.RENT } }),
    prisma.user.count(),
    prisma.inquiry.count(),
  ]);

  return {
    totalProperties,
    publishedProperties,
    propertiesForSale,
    propertiesForRent,
    users,
    inquiries,
  };
}
