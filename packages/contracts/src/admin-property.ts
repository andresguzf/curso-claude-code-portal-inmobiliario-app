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
  /**
   * Cuándo salió al portal por primera vez, o `null` si nunca lo hizo.
   *
   * No lo escribe el formulario: lo sella el servidor al publicar. Se
   * conserva al despublicar, así que una propiedad puede estar en borrador y
   * tener fecha (spec.md, sección 3).
   */
  readonly publishedAt: string | null;
};

/**
 * Estado de publicación por el que se puede acotar el listado.
 *
 * `all` no es un valor que se envíe: es la ausencia del filtro, y se declara
 * para poder nombrarla en la interfaz sin repetir la cadena vacía.
 */
export const AdminPropertyStatus = {
  ALL: "all",
  PUBLISHED: "published",
  DRAFT: "draft",
} as const;

export type AdminPropertyStatusValue =
  (typeof AdminPropertyStatus)[keyof typeof AdminPropertyStatus];

export function isAdminPropertyStatus(
  value: unknown,
): value is AdminPropertyStatusValue {
  return (
    typeof value === "string" &&
    Object.values<string>(AdminPropertyStatus).includes(value)
  );
}

/**
 * Filtros del listado de administración (spec.md, sección 19).
 *
 * Son combinables entre sí y con la búsqueda, y viven en la URL para que el
 * resultado se pueda compartir, igual que en el catálogo público.
 *
 * La diferencia principal con aquel es `status`: allí no hay borradores que
 * distinguir.
 */
export type AdminPropertyListQuery = {
  readonly search?: string | undefined;
  readonly page?: number | undefined;
  readonly minPrice?: number | undefined;
  readonly maxPrice?: number | undefined;
  readonly status?: AdminPropertyStatusValue | undefined;
  /** Admite varios: `?type=HOUSE&type=APARTMENT`. */
  readonly types?: readonly PropertyTypeValue[] | undefined;
  /** Admite ambas, que equivale a no filtrar por operación. */
  readonly operations?: readonly OperationTypeValue[] | undefined;
  /** Fecha `AAAA-MM-DD` inclusive. */
  readonly publishedFrom?: string | undefined;
  /** Fecha `AAAA-MM-DD` inclusive: cubre el día entero. */
  readonly publishedTo?: string | undefined;
};

/**
 * Nombres de los parámetros en la URL.
 *
 * Los múltiples van en singular y se repiten, que es la convención de HTML
 * y la que ya usa el catálogo público.
 */
export const ADMIN_QUERY_PARAM_NAMES = {
  search: "search",
  page: "page",
  minPrice: "minPrice",
  maxPrice: "maxPrice",
  status: "status",
  types: "type",
  operations: "operation",
  publishedFrom: "publishedFrom",
  publishedTo: "publishedTo",
} as const satisfies Record<keyof AdminPropertyListQuery, string>;

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
