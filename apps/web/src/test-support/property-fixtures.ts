import type { PropertyDetailDto, PropertySummaryDto } from "@portal/contracts";

/**
 * Constructores de datos para las pruebas.
 *
 * Este módulo es solo para tests: no debe importarse desde código de
 * producción.
 */
export function buildPropertySummary(
  overrides: Partial<PropertySummaryDto> = {},
): PropertySummaryDto {
  return {
    id: "property-1",
    title: "Casa en Las Condes",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 890000,
    currency: "USD",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    bedrooms: 4,
    bathrooms: 3,
    usableAreaSquareMeters: 180,
    isFeatured: false,
    primaryImage: {
      id: "image-1",
      url: "https://picsum.photos/seed/property-1/1200/800",
      publicId: "seed/property-1",
      position: 0,
      isPrimary: true,
    },
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  };
}

export function buildPropertyDetail(
  overrides: Partial<PropertyDetailDto> = {},
): PropertyDetailDto {
  return {
    ...buildPropertySummary(),
    description: "Casa amplia con jardín y quincho.\nSegundo párrafo.",
    address: "Avenida Presidente Riesco 4520",
    totalAreaSquareMeters: 420,
    parkingSpaces: 2,
    ageYears: 12,
    features: [
      { id: "f1", name: "Piscina", slug: "piscina" },
      { id: "f2", name: "Quincho", slug: "quincho" },
    ],
    images: [
      {
        id: "image-1",
        url: "https://picsum.photos/seed/property-1/1200/800",
        publicId: "seed/property-1",
        position: 0,
        isPrimary: true,
      },
    ],
    updatedAt: "2026-02-01T08:00:00.000Z",
    ...overrides,
  };
}
