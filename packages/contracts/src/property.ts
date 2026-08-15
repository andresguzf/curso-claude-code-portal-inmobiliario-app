import type {
  CurrencyValue,
  OperationTypeValue,
  PropertyTypeValue,
} from "./domain";

/**
 * Contrato de la API REST de propiedades.
 *
 * Es la frontera entre el backend y el frontend: ambos dependen de estos
 * tipos y de ninguna estructura interna del otro. Los tipos `Decimal` y
 * `Date` de la base de datos no aparecen aquí porque no son serializables
 * a JSON de forma estable.
 */

export type PropertyImageDto = {
  readonly id: string;
  readonly url: string;
  readonly publicId: string;
  readonly position: number;
  readonly isPrimary: boolean;
};

export type PropertyFeatureDto = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
};

/** Datos necesarios para una tarjeta del catálogo (spec.md, sección 8). */
export type PropertySummaryDto = {
  readonly id: string;
  readonly title: string;
  readonly operationType: OperationTypeValue;
  readonly propertyType: PropertyTypeValue;
  readonly price: number;
  readonly currency: CurrencyValue;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly usableAreaSquareMeters: number | null;
  readonly isFeatured: boolean;
  readonly primaryImage: PropertyImageDto | null;
  readonly createdAt: string;
};

/** Datos del detalle de una propiedad (spec.md, sección 12). */
export type PropertyDetailDto = PropertySummaryDto & {
  readonly description: string;
  readonly address: string;
  readonly totalAreaSquareMeters: number | null;
  readonly parkingSpaces: number | null;
  readonly ageYears: number | null;
  readonly features: readonly PropertyFeatureDto[];
  readonly images: readonly PropertyImageDto[];
  readonly updatedAt: string;
};

/** Respuesta de la colección de propiedades. */
export type PropertyListDto = {
  readonly data: readonly PropertySummaryDto[];
  readonly total: number;
};

/** Formato uniforme de error (plan.md, sección 14). */
export type ApiErrorDto = {
  readonly message: string;
  readonly status: number;
};
