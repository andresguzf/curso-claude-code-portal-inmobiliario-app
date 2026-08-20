import type { AdminPropertyDto } from "@portal/contracts";

import type { PropertyRecord } from "@/services/property-mapper";

/**
 * Traducción de una fila de `properties` al DTO de administración.
 *
 * Se construye campo a campo en lugar de partir del resumen público: aquel
 * lleva `primaryImage`, que aquí sobra porque va la galería completa y
 * ordenada, y colarlo por un `spread` haría que el DTO devolviera algo que
 * su tipo no declara.
 */
export function toAdminProperty(
  property: PropertyRecord & { readonly isPublished: boolean },
): AdminPropertyDto {
  const images = [...property.images].sort(
    (first, second) => first.position - second.position,
  );
  const features = [...(property.features ?? [])].sort((first, second) =>
    first.name.localeCompare(second.name, "es"),
  );

  return {
    id: property.id,
    title: property.title,
    description: property.description,
    operationType: property.operationType,
    propertyType: property.propertyType,
    price: toNumber(property.price) as number,
    currency: property.currency,
    usableAreaSquareMeters: toNumber(property.usableAreaSquareMeters),
    totalAreaSquareMeters: toNumber(property.totalAreaSquareMeters),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    ageYears: property.ageYears,
    address: property.address,
    commune: property.commune,
    city: property.city,
    region: property.region,
    isPublished: property.isPublished,
    isFeatured: property.isFeatured,
    features: features.map((feature) => ({
      id: feature.id,
      name: feature.name,
      slug: feature.slug,
    })),
    images: images.map((image) => ({
      id: image.id,
      url: image.url,
      publicId: image.publicId,
      position: image.position,
      isPrimary: image.isPrimary,
    })),
    createdAt: property.createdAt.toISOString(),
    updatedAt: property.updatedAt.toISOString(),
  };
}

/** `Decimal` de Prisma o un número plano. */
function toNumber(
  value: number | { toNumber: () => number } | null,
): number | null {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : value.toNumber();
}
