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

/**
 * Parámetros de consulta de `GET /api/properties`.
 *
 * Todos son opcionales y combinables (spec.md, sección 10). El ordenamiento
 * se incorpora en el paso 12.
 */
export type PropertyListQuery = {
  /** Búsqueda textual sobre título, comuna, ciudad, región y descripción. */
  readonly search?: string | undefined;
  /**
   * Venta o arriendo. Admite ambas: `?operation=SALE&operation=RENT`, que
   * equivale a no filtrar por operación.
   */
  readonly operations?: readonly OperationTypeValue[] | undefined;
  /**
   * Tipos de propiedad. Admite varios («casa o departamento») y se expresa
   * repitiendo el parámetro: `?type=HOUSE&type=APARTMENT`.
   */
  readonly types?: readonly PropertyTypeValue[] | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  /** Mínimo de dormitorios: «3» significa «3 o más». */
  readonly bedrooms?: number | undefined;
  /** Mínimo de baños: «2» significa «2 o más». */
  readonly bathrooms?: number | undefined;
  readonly minUsableArea?: number | undefined;
  /** Comunas. Admite varias: `?commune=Las+Condes&commune=Providencia`. */
  readonly communes?: readonly string[] | undefined;
  /** Ciudad. De selección única. */
  readonly city?: string | undefined;
  /** Región. De selección única. */
  readonly region?: string | undefined;
  /** Criterio de ordenamiento. */
  readonly sort?: PropertySortValue | undefined;
};

/** Criterios de ordenamiento (spec.md, sección 11). */
export const PropertySort = {
  NEWEST: "newest",
  PRICE_ASC: "price-asc",
  PRICE_DESC: "price-desc",
  AREA_ASC: "area-asc",
  AREA_DESC: "area-desc",
} as const;

export type PropertySortValue =
  (typeof PropertySort)[keyof typeof PropertySort];

/** El catálogo muestra primero lo más reciente si no se pide otro orden. */
export const DEFAULT_PROPERTY_SORT: PropertySortValue = PropertySort.NEWEST;

export function isPropertySort(value: unknown): value is PropertySortValue {
  return (
    typeof value === "string" &&
    Object.values<string>(PropertySort).includes(value)
  );
}

/**
 * Nombres de los parámetros en la URL.
 *
 * Se mantienen en singular aunque admitan varios valores, para conservar las
 * URLs que ejemplifica la especificación (`?commune=las-condes`) y porque
 * repetir el parámetro es la convención de HTML para selección múltiple.
 */
export const QUERY_PARAM_NAMES = {
  search: "search",
  operations: "operation",
  types: "type",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  bedrooms: "bedrooms",
  bathrooms: "bathrooms",
  minUsableArea: "minUsableArea",
  communes: "commune",
  city: "city",
  region: "region",
  sort: "sort",
} as const satisfies Record<keyof PropertyListQuery, string>;

/** Valores admitidos para los filtros de ubicación (spec.md, sección 10). */
export type PropertyFilterOptionsDto = {
  readonly communes: readonly string[];
  readonly cities: readonly string[];
  readonly regions: readonly string[];
};

/** Largo máximo aceptado en la búsqueda textual. */
export const MAX_SEARCH_LENGTH = 120;

/** Largo máximo de un valor de ubicación. */
export const MAX_LOCATION_LENGTH = 120;

/** Cotas de los filtros numéricos, alineadas con el esquema de PostgreSQL. */
export const FILTER_LIMITS = {
  /** `price` es `Decimal(12, 2)`. */
  maxPrice: 9_999_999_999,
  maxRooms: 20,
  maxUsableArea: 1_000_000,
} as const;

/** Formato uniforme de error (plan.md, sección 14). */
export type ApiErrorDto = {
  readonly message: string;
  readonly status: number;
};
