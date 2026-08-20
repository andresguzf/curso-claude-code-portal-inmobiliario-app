import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Acceso a `features`.
 *
 * La tabla es el vocabulario de características del portal: las propiedades
 * se conectan a sus filas, no guardan texto libre. Por eso el formulario
 * ofrece opciones y no un campo abierto.
 */

export function findAllFeatures() {
  return prisma.feature.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
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
