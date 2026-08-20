import type {
  CurrencyValue,
  OperationTypeValue,
  PropertyTypeValue,
} from "./domain";
import type { PropertyFeatureDto, PropertyImageDto } from "./property";

/**
 * Contrato del CRUD de propiedades (spec.md, sección 19).
 *
 * No reutiliza los DTO públicos a propósito: estos llevan `isPublished`, que
 * el catálogo no debe conocer, y no llevan coordenadas, que solo tienen
 * sentido en la ficha pública y costarían una geocodificación por fila en un
 * listado de administración.
 */

export type AdminPropertyDto = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly operationType: OperationTypeValue;
  readonly propertyType: PropertyTypeValue;
  readonly price: number;
  readonly currency: CurrencyValue;
  readonly usableAreaSquareMeters: number | null;
  readonly totalAreaSquareMeters: number | null;
  readonly bedrooms: number | null;
  readonly bathrooms: number | null;
  readonly parkingSpaces: number | null;
  readonly ageYears: number | null;
  readonly address: string;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
  readonly isPublished: boolean;
  readonly isFeatured: boolean;
  readonly features: readonly PropertyFeatureDto[];
  readonly images: readonly PropertyImageDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Página del listado de administración. */
export type AdminPropertyPageDto = {
  readonly data: readonly AdminPropertyDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

/**
 * Datos que ADMIN envía al crear o actualizar.
 *
 * No incluye latitud ni longitud: la ubicación se captura como texto y las
 * coordenadas las deduce el servidor (spec.md, sección 6). Tampoco `currency`,
 * que hoy solo admite un valor, ni las imágenes, que se administran aparte
 * (paso 27).
 */
export type PropertyInputDto = {
  readonly title: string;
  readonly description: string;
  readonly operationType: OperationTypeValue;
  readonly propertyType: PropertyTypeValue;
  readonly price: number;
  readonly usableAreaSquareMeters?: number | null;
  readonly totalAreaSquareMeters?: number | null;
  readonly bedrooms?: number | null;
  readonly bathrooms?: number | null;
  readonly parkingSpaces?: number | null;
  readonly ageYears?: number | null;
  readonly address: string;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
  readonly featureSlugs?: readonly string[];
  readonly isPublished?: boolean;
  readonly isFeatured?: boolean;
};

/** Propiedades por página en el listado de administración. */
export const ADMIN_PROPERTIES_PER_PAGE = 10;

/**
 * Cotas de los campos, alineadas con las columnas de PostgreSQL.
 *
 * Rechazar aquí lo que la base rechazaría convierte un error de escritura en
 * un mensaje claro, en vez de en un 500.
 */
export const PROPERTY_LIMITS = {
  maxTitleLength: 160,
  maxDescriptionLength: 5000,
  maxLocationLength: 120,
  /** `price` es `Decimal(12, 2)`. */
  maxPrice: 9_999_999_999,
  /** Las superficies son `Decimal(10, 2)`. */
  maxArea: 99_999_999,
  maxRooms: 100,
  maxAgeYears: 500,
} as const;
