import type {
  CurrencyValue,
  GeoCoordinatesDto,
  OperationTypeValue,
  PropertyDetailDto,
  PropertyFeatureDto,
  PropertyImageDto,
  PropertySummaryDto,
  PropertyTypeValue,
} from "@portal/contracts";

/**
 * Traducción entre las filas de PostgreSQL y los DTO de la API.
 *
 * Las funciones son puras y describen su entrada de forma estructural, no en
 * términos de los tipos de Prisma: así se pueden probar sin base de datos y
 * un cambio de ORM no obliga a reescribirlas.
 */

/** `Decimal` de Prisma o un número plano. */
type DecimalLike = number | { toNumber: () => number };

export type PropertyImageRecord = {
  readonly id: string;
  readonly url: string;
  readonly publicId: string;
  readonly position: number;
  readonly isPrimary: boolean;
};

export type PropertyFeatureRecord = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

export type PropertyRecord = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly operationType: OperationTypeValue;
  readonly propertyType: PropertyTypeValue;
  readonly price: DecimalLike;
  readonly currency: CurrencyValue;
  readonly usableAreaSquareMeters: DecimalLike | null;
  readonly totalAreaSquareMeters: DecimalLike | null;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly parkingSpaces: number | null;
  readonly ageYears: number | null;
  readonly address: string;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
  readonly isFeatured: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly images: readonly PropertyImageRecord[];
  readonly features?: readonly PropertyFeatureRecord[];
};

function toNumber(value: DecimalLike): number;
function toNumber(value: DecimalLike | null): number | null;
function toNumber(value: DecimalLike | null): number | null {
  if (value === null) {
    return null;
  }

  return typeof value === "number" ? value : value.toNumber();
}

function toImageDto(image: PropertyImageRecord): PropertyImageDto {
  return {
    id: image.id,
    url: image.url,
    publicId: image.publicId,
    position: image.position,
    isPrimary: image.isPrimary,
  };
}

function toFeatureDto(feature: PropertyFeatureRecord): PropertyFeatureDto {
  return { id: feature.id, name: feature.name, slug: feature.slug };
}

/**
 * Selecciona la imagen que representa a la propiedad.
 *
 * Si ninguna está marcada como principal se usa la de menor posición, para
 * que una tarjeta del catálogo nunca quede sin imagen teniéndola disponible.
 */
export function selectPrimaryImage(
  images: readonly PropertyImageRecord[],
): PropertyImageDto | null {
  if (images.length === 0) {
    return null;
  }

  const sortedByPosition = [...images].sort(
    (first, second) => first.position - second.position,
  );
  const primaryImage =
    sortedByPosition.find((image) => image.isPrimary) ?? sortedByPosition[0];

  return primaryImage ? toImageDto(primaryImage) : null;
}

export function toPropertySummary(
  property: PropertyRecord,
): PropertySummaryDto {
  return {
    id: property.id,
    title: property.title,
    operationType: property.operationType,
    propertyType: property.propertyType,
    price: toNumber(property.price),
    currency: property.currency,
    commune: property.commune,
    city: property.city,
    region: property.region,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    usableAreaSquareMeters: toNumber(property.usableAreaSquareMeters),
    isFeatured: property.isFeatured,
    primaryImage: selectPrimaryImage(property.images),
    createdAt: property.createdAt.toISOString(),
  };
}

/**
 * Datos del detalle que no provienen de la fila de PostgreSQL.
 *
 * Las coordenadas dependen de una consulta a Google, no de la fila de la
 * base de datos, y este módulo debe seguir siendo puro: se reciben ya
 * resueltas en lugar de pedirlas aquí.
 */
export type PropertyDetailContext = {
  readonly coordinates: GeoCoordinatesDto | null;
};

export function toPropertyDetail(
  property: PropertyRecord,
  context: PropertyDetailContext,
): PropertyDetailDto {
  const images = [...property.images].sort(
    (first, second) => first.position - second.position,
  );
  const features = [...(property.features ?? [])].sort((first, second) =>
    first.name.localeCompare(second.name, "es"),
  );

  return {
    ...toPropertySummary(property),
    description: property.description,
    address: property.address,
    totalAreaSquareMeters: toNumber(property.totalAreaSquareMeters),
    parkingSpaces: property.parkingSpaces,
    ageYears: property.ageYears,
    features: features.map(toFeatureDto),
    images: images.map(toImageDto),
    coordinates: context.coordinates,
    updatedAt: property.updatedAt.toISOString(),
  };
}
