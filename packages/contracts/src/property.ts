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

/** Punto en el mapa, en grados decimales. */
export type GeoCoordinatesDto = {
  readonly latitude: number;
  readonly longitude: number;
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
  /**
   * Coordenadas derivadas de la dirección por geocodificación.
   *
   * Es `null` cuando la geocodificación no está configurada o Google no
   * reconoce la dirección. ADMIN nunca las escribe ni las ve: las deduce el
   * servidor a partir de la dirección textual (spec.md, sección 6).
   */
  readonly coordinates: GeoCoordinatesDto | null;
  readonly updatedAt: string;
};

/**
 * Cuántas propiedades trae cada página del catálogo (spec.md, sección 8).
 *
 * Nueve llena tres filas de la rejilla en escritorio. Lo fija el servidor y no
 * viaja en la petición: dejar que el cliente eligiera el tamaño convierte
 * `?pageSize=100000` en una forma de pedir el catálogo entero.
 */
export const PROPERTIES_PER_PAGE = 9;

/**
 * Una colección de propiedades que se devuelve entera.
 *
 * Es lo que responden los favoritos: son los de una persona, no crecen sin
 * límite y se muestran de una vez.
 */
export type PropertyCollectionDto = {
  readonly data: readonly PropertySummaryDto[];
  readonly total: number;
};

/**
 * Una página del catálogo.
 *
 * Se distingue de la colección a propósito: quien recibe esto puede calcular
 * cuántas páginas hay, y quien recibe aquello sabe que ya lo tiene todo.
 */
export type PropertyListDto = PropertyCollectionDto & {
  readonly page: number;
  readonly pageSize: number;
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
  /**
   * Solo las destacadas.
   *
   * No es un filtro del catálogo —la interfaz no lo ofrece—: lo usa la portada
   * para pedir su selección sin traerse el catálogo entero y recortarlo.
   */
  readonly featured?: boolean | undefined;
  /** Página del catálogo, empezando en 1. */
  readonly page?: number | undefined;
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
  featured: "featured",
  page: "page",
} as const satisfies Record<keyof PropertyListQuery, string>;

/** Valores admitidos para los filtros de ubicación (spec.md, sección 10). */
export type PropertyFilterOptionsDto = {
  readonly communes: readonly string[];
  readonly cities: readonly string[];
  readonly regions: readonly string[];
};

/**
 * Orden definitivo de la galería de una propiedad (spec.md, sección 20).
 *
 * Lleva la lista completa, no un movimiento: enviar «sube esta una posición»
 * obligaría al servidor a reconstruir el resto y dos peticiones seguidas se
 * pisarían. Con la lista entera, la última que llega manda.
 */
export type PropertyImageOrderDto = {
  readonly imageIds: readonly string[];
};

/**
 * Cotas de las imágenes de una propiedad (spec.md, sección 5).
 *
 * Viven en el contrato para que el navegador rechace lo mismo que el
 * backend: así quien elige un archivo de 20 MB lo sabe antes de esperar la
 * subida entera. La comprobación que protege es la del servidor.
 */
export const IMAGE_LIMITS = {
  /** Cinco megabytes. Una fotografía de portada bien exportada no llega. */
  maxBytes: 5 * 1024 * 1024,
  /**
   * Formatos admitidos.
   *
   * Se declaran uno a uno en lugar de aceptar cualquier `image/*`: `image/svg+xml`
   * también es una imagen, y admite scripts.
   */
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ] as readonly string[],
  /** Tope por propiedad, para que una galería siga siendo hojeable. */
  maxImagesPerProperty: 12,
} as const;

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

/**
 * Identificadores de las propiedades guardadas (spec.md, sección 16).
 *
 * Se devuelven aparte de la lista completa para que una página con muchas
 * tarjetas sepa cuáles marcar sin traerse la ficha de cada una.
 */
export type FavoriteIdsDto = {
  readonly propertyIds: readonly string[];
};

/** Formato uniforme de error (plan.md, sección 14). */
export type ApiErrorDto = {
  readonly message: string;
  readonly status: number;
};
