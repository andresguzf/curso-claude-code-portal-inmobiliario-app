import {
  DEFAULT_PROPERTY_SORT,
  FILTER_LIMITS,
  MAX_LOCATION_LENGTH,
  MAX_SEARCH_LENGTH,
  PropertySort,
  QUERY_PARAM_NAMES,
  isOperationType,
  isPropertySort,
  isPropertyType,
  type OperationTypeValue,
  type PropertyListQuery,
  type PropertySortValue,
  type PropertyTypeValue,
} from "@portal/contracts";

import { buildSearchConditions, parseSearchTerms } from "./property-search";

/**
 * Lectura, validación y traducción de los filtros del catálogo
 * (spec.md, sección 10).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar todas
 * las reglas de validación sin base de datos ni servidor.
 */

export type QueryParseResult =
  | { readonly ok: true; readonly query: PropertyListQuery }
  | { readonly ok: false; readonly message: string };

type NumericLimits = {
  readonly max: number;
  readonly integerOnly?: boolean;
};

type NumericFilterName =
  "minPrice" | "maxPrice" | "bedrooms" | "bathrooms" | "minUsableArea";

const NUMERIC_FILTERS: Record<NumericFilterName, NumericLimits> = {
  minPrice: { max: FILTER_LIMITS.maxPrice },
  maxPrice: { max: FILTER_LIMITS.maxPrice },
  bedrooms: { max: FILTER_LIMITS.maxRooms, integerOnly: true },
  bathrooms: { max: FILTER_LIMITS.maxRooms, integerOnly: true },
  minUsableArea: { max: FILTER_LIMITS.maxUsableArea },
};

/** Lector de parámetros, compatible con `URLSearchParams`. */
type QueryReader = {
  get: (name: string) => string | null;
  getAll: (name: string) => string[];
};

/**
 * Normaliza un valor de ubicación.
 *
 * La especificación ejemplifica `commune=las-condes`, así que los guiones se
 * interpretan como espacios. La comparación posterior ignora mayúsculas.
 */
export function normalizeLocationValue(rawValue: string): string {
  return rawValue.replaceAll("-", " ").trim().replace(/\s+/g, " ");
}

/** Descarta vacíos y duplicados conservando el orden de aparición. */
function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value !== ""))];
}

function parseNumericFilter(
  name: NumericFilterName,
  rawValue: string,
): { readonly value: number } | { readonly message: string } {
  const { max, integerOnly } = NUMERIC_FILTERS[name];
  const value = Number(rawValue);

  if (rawValue.trim() === "" || !Number.isFinite(value)) {
    return { message: `El parámetro «${name}» debe ser un número.` };
  }

  if (value < 0) {
    return { message: `El parámetro «${name}» no puede ser negativo.` };
  }

  if (integerOnly && !Number.isInteger(value)) {
    return { message: `El parámetro «${name}» debe ser un número entero.` };
  }

  if (value > max) {
    return { message: `El parámetro «${name}» no puede superar ${max}.` };
  }

  return { value };
}

/**
 * Interpreta los parámetros de la URL.
 *
 * Un parámetro presente pero inválido produce un error en lugar de
 * ignorarse: devolver resultados que no corresponden al filtro pedido es
 * peor que rechazar la solicitud (plan.md, sección 14).
 */
export function parsePropertyListQuery(
  searchParams: QueryReader,
): QueryParseResult {
  const query: {
    -readonly [Key in keyof PropertyListQuery]: PropertyListQuery[Key];
  } = {};

  const search = searchParams.get(QUERY_PARAM_NAMES.search);

  if (search !== null) {
    if (search.length > MAX_SEARCH_LENGTH) {
      return {
        ok: false,
        message: `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
      };
    }

    query.search = search;
  }

  const operations = uniqueValues(
    searchParams.getAll(QUERY_PARAM_NAMES.operations),
  );

  for (const operation of operations) {
    if (!isOperationType(operation)) {
      return {
        ok: false,
        message: "El parámetro «operation» debe ser SALE o RENT.",
      };
    }
  }

  if (operations.length > 0) {
    query.operations = operations as OperationTypeValue[];
  }

  const types = uniqueValues(searchParams.getAll(QUERY_PARAM_NAMES.types));

  for (const propertyType of types) {
    if (!isPropertyType(propertyType)) {
      return {
        ok: false,
        message:
          "El parámetro «type» debe ser HOUSE, APARTMENT, LAND, OFFICE, COMMERCIAL u OTHER.",
      };
    }
  }

  if (types.length > 0) {
    query.types = types as PropertyTypeValue[];
  }

  for (const name of Object.keys(NUMERIC_FILTERS) as NumericFilterName[]) {
    const rawValue = searchParams.get(name);

    if (rawValue === null || rawValue === "") {
      continue;
    }

    const parsed = parseNumericFilter(name, rawValue);

    if ("message" in parsed) {
      return { ok: false, message: parsed.message };
    }

    query[name] = parsed.value;
  }

  const rawCommunes = searchParams.getAll(QUERY_PARAM_NAMES.communes);

  for (const rawCommune of rawCommunes) {
    if (rawCommune.length > MAX_LOCATION_LENGTH) {
      return {
        ok: false,
        message: `El parámetro «commune» no puede superar ${MAX_LOCATION_LENGTH} caracteres.`,
      };
    }
  }

  const communes = uniqueValues(rawCommunes.map(normalizeLocationValue));

  if (communes.length > 0) {
    query.communes = communes;
  }

  for (const name of ["city", "region"] as const) {
    const rawValue = searchParams.get(QUERY_PARAM_NAMES[name]);

    if (rawValue === null || rawValue === "") {
      continue;
    }

    if (rawValue.length > MAX_LOCATION_LENGTH) {
      return {
        ok: false,
        message: `El parámetro «${name}» no puede superar ${MAX_LOCATION_LENGTH} caracteres.`,
      };
    }

    const normalized = normalizeLocationValue(rawValue);

    if (normalized !== "") {
      query[name] = normalized;
    }
  }

  const sort = searchParams.get(QUERY_PARAM_NAMES.sort);

  if (sort !== null && sort !== "") {
    if (!isPropertySort(sort)) {
      return {
        ok: false,
        message: `El parámetro «sort» debe ser uno de: ${Object.values(
          PropertySort,
        ).join(", ")}.`,
      };
    }

    query.sort = sort;
  }

  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    return {
      ok: false,
      message: "El precio mínimo no puede ser mayor que el precio máximo.",
    };
  }

  return { ok: true, query };
}

type OrderDirection = "asc" | "desc";

type PropertyOrderBy = ReadonlyArray<
  | { readonly createdAt: OrderDirection }
  | { readonly price: OrderDirection }
  | {
      readonly usableAreaSquareMeters: {
        readonly sort: OrderDirection;
        readonly nulls: "last";
      };
    }
>;

/**
 * Traduce el criterio de ordenamiento a cláusulas de PostgreSQL
 * (spec.md, sección 11).
 *
 * Todos los criterios terminan desempatando por `createdAt`, para que dos
 * propiedades del mismo precio o superficie mantengan siempre el mismo orden;
 * sin ese desempate la posición podría variar entre consultas.
 *
 * Las propiedades sin superficie declarada —un terreno, por ejemplo— van al
 * final en ambas direcciones: un valor ausente no es «el más pequeño».
 */
export function buildPropertyOrderBy(
  sort: PropertySortValue = DEFAULT_PROPERTY_SORT,
): PropertyOrderBy {
  switch (sort) {
    case PropertySort.PRICE_ASC:
      return [{ price: "asc" }, { createdAt: "desc" }];
    case PropertySort.PRICE_DESC:
      return [{ price: "desc" }, { createdAt: "desc" }];
    case PropertySort.AREA_ASC:
      return [
        { usableAreaSquareMeters: { sort: "asc", nulls: "last" } },
        { createdAt: "desc" },
      ];
    case PropertySort.AREA_DESC:
      return [
        { usableAreaSquareMeters: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ];
    case PropertySort.NEWEST:
      return [{ createdAt: "desc" }];
  }
}

type InsensitiveEquals = {
  readonly equals: string;
  readonly mode: "insensitive";
};

type WhereCondition = Record<string, unknown>;

/**
 * Compara un campo de texto contra varios valores admitidos.
 *
 * Se usa `OR` de igualdades en lugar de `in` porque `in` de Prisma no aplica
 * `mode: "insensitive"`, y una comuna escrita en minúsculas en la URL no
 * coincidiría con «Las Condes» en la base de datos.
 */
function anyOfInsensitive(
  field: string,
  values: readonly string[],
): WhereCondition {
  return {
    OR: values.map((value): Record<string, InsensitiveEquals> => ({
      [field]: { equals: value, mode: "insensitive" },
    })),
  };
}

/**
 * Construye la condición `where` de Prisma.
 *
 * Filtros distintos se combinan con AND, de modo que agregar uno siempre
 * acota el resultado. Los valores de un mismo filtro múltiple se combinan
 * con OR: pedir Las Condes y Providencia devuelve las de ambas comunas
 * (spec.md, sección 10).
 *
 * `bedrooms` y `bathrooms` se aplican como mínimo, no como igualdad: es la
 * convención del rubro («3 o más dormitorios») y además descarta las
 * propiedades sin ese dato, como los terrenos.
 */
export function buildPropertyWhere(
  query: PropertyListQuery,
  options: { readonly isPublished?: boolean } = {},
) {
  const {
    search,
    operations,
    types,
    minPrice,
    maxPrice,
    bedrooms,
    bathrooms,
    minUsableArea,
    communes,
    city,
    region,
  } = query;

  const conditions: WhereCondition[] = [];

  // Cada término de búsqueda debe aparecer en algún campo.
  conditions.push(...buildSearchConditions(parseSearchTerms(search)));

  if (communes && communes.length > 0) {
    conditions.push(anyOfInsensitive("commune", communes));
  }

  const priceRange = {
    ...(minPrice === undefined ? {} : { gte: minPrice }),
    ...(maxPrice === undefined ? {} : { lte: maxPrice }),
  };

  return {
    // Una propiedad eliminada no existe para nadie. Va aquí, y no en cada
    // consulta, porque este es el único paso obligado del catálogo: repartir
    // la condición sería olvidarla en la siguiente que alguien escriba
    // (spec.md, sección 19).
    deletedAt: null,
    ...(options.isPublished === undefined
      ? {}
      : { isPublished: options.isPublished }),
    // Las enumeraciones ya están validadas, así que `in` es exacto y seguro.
    ...(operations && operations.length > 0
      ? { operationType: { in: [...operations] } }
      : {}),
    ...(types && types.length > 0 ? { propertyType: { in: [...types] } } : {}),
    ...(Object.keys(priceRange).length === 0 ? {} : { price: priceRange }),
    ...(bedrooms === undefined ? {} : { bedrooms: { gte: bedrooms } }),
    ...(bathrooms === undefined ? {} : { bathrooms: { gte: bathrooms } }),
    ...(minUsableArea === undefined
      ? {}
      : { usableAreaSquareMeters: { gte: minUsableArea } }),
    ...(city === undefined
      ? {}
      : { city: { equals: city, mode: "insensitive" as const } }),
    ...(region === undefined
      ? {}
      : { region: { equals: region, mode: "insensitive" as const } }),
    ...(conditions.length === 0 ? {} : { AND: conditions }),
  };
}
