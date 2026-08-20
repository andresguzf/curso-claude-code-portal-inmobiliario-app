import {
  ADMIN_QUERY_PARAM_NAMES,
  AdminPropertyStatus,
  FILTER_LIMITS,
  MAX_SEARCH_LENGTH,
  isAdminPropertyStatus,
  isOperationType,
  isPropertyType,
  type AdminPropertyListQuery,
  type OperationTypeValue,
  type PropertyTypeValue,
} from "@portal/contracts";

/**
 * Lectura, validación y traducción de los filtros del listado de
 * administración (spec.md, sección 19).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar todas
 * las reglas sin base de datos ni servidor. Es el mismo reparto que usa el
 * catálogo público en `property-query.ts`.
 *
 * Un parámetro presente pero inválido produce un error en lugar de
 * ignorarse: devolver un listado que no corresponde al filtro pedido es peor
 * que rechazar la solicitud (plan.md, sección 14).
 */

export type AdminQueryParseResult =
  | { readonly ok: true; readonly query: AdminPropertyListQuery }
  | { readonly ok: false; readonly message: string };

/** Lector de parámetros, compatible con `URLSearchParams`. */
type QueryReader = {
  get: (name: string) => string | null;
  getAll: (name: string) => string[];
};

/**
 * Fecha de calendario `AAAA-MM-DD`.
 *
 * Se interpreta en UTC, que es como PostgreSQL guarda las marcas de tiempo.
 * Para un filtro por día es una simplificación consciente: una propiedad
 * publicada de madrugada en Chile pertenece, en UTC, al día siguiente. La
 * alternativa —resolver el desfase horario de Chile, con su horario de
 * verano— no compensa en un filtro de administración.
 */
const CALENDAR_DATE = /^\d{4}-\d{2}-\d{2}$/;

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;

export function parseAdminPropertyListQuery(
  searchParams: QueryReader,
): AdminQueryParseResult {
  const query: {
    -readonly [
      Key in keyof AdminPropertyListQuery
    ]: AdminPropertyListQuery[Key];
  } = {};

  const search = searchParams.get(ADMIN_QUERY_PARAM_NAMES.search);

  if (search !== null) {
    if (search.length > MAX_SEARCH_LENGTH) {
      return {
        ok: false,
        message: `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
      };
    }

    query.search = search;
  }

  const page = searchParams.get(ADMIN_QUERY_PARAM_NAMES.page);

  if (page !== null && page !== "") {
    const value = Number(page);

    if (!Number.isInteger(value) || value < 1) {
      return {
        ok: false,
        message: "El parámetro «page» debe ser un entero mayor que cero.",
      };
    }

    query.page = value;
  }

  for (const name of ["minPrice", "maxPrice"] as const) {
    const rawValue = searchParams.get(ADMIN_QUERY_PARAM_NAMES[name]);

    if (rawValue === null || rawValue === "") {
      continue;
    }

    const value = Number(rawValue);

    if (!Number.isFinite(value)) {
      return {
        ok: false,
        message: `El parámetro «${name}» debe ser un número.`,
      };
    }

    if (value < 0) {
      return {
        ok: false,
        message: `El parámetro «${name}» no puede ser negativo.`,
      };
    }

    if (value > FILTER_LIMITS.maxPrice) {
      return {
        ok: false,
        message: `El parámetro «${name}» no puede superar ${FILTER_LIMITS.maxPrice}.`,
      };
    }

    query[name] = value;
  }

  if (
    query.minPrice !== undefined &&
    query.maxPrice !== undefined &&
    query.minPrice > query.maxPrice
  ) {
    return {
      ok: false,
      message: "El precio mínimo no puede superar al máximo.",
    };
  }

  const status = searchParams.get(ADMIN_QUERY_PARAM_NAMES.status);

  if (status !== null && status !== "") {
    if (!isAdminPropertyStatus(status)) {
      return { ok: false, message: "El estado pedido no es válido." };
    }

    query.status = status;
  }

  const types = uniqueValues(
    searchParams.getAll(ADMIN_QUERY_PARAM_NAMES.types),
  );

  if (types.length > 0) {
    if (!types.every(isPropertyType)) {
      return { ok: false, message: "El tipo de propiedad no es válido." };
    }

    query.types = types as PropertyTypeValue[];
  }

  const operations = uniqueValues(
    searchParams.getAll(ADMIN_QUERY_PARAM_NAMES.operations),
  );

  if (operations.length > 0) {
    if (!operations.every(isOperationType)) {
      return { ok: false, message: "La operación no es válida." };
    }

    query.operations = operations as OperationTypeValue[];
  }

  for (const name of ["publishedFrom", "publishedTo"] as const) {
    const rawValue = searchParams.get(ADMIN_QUERY_PARAM_NAMES[name]);

    if (rawValue === null || rawValue === "") {
      continue;
    }

    if (!CALENDAR_DATE.test(rawValue) || Number.isNaN(Date.parse(rawValue))) {
      return {
        ok: false,
        message: `El parámetro «${name}» debe ser una fecha AAAA-MM-DD.`,
      };
    }

    query[name] = rawValue;
  }

  if (
    query.publishedFrom !== undefined &&
    query.publishedTo !== undefined &&
    query.publishedFrom > query.publishedTo
  ) {
    return {
      ok: false,
      message: "La fecha inicial no puede ser posterior a la final.",
    };
  }

  return { ok: true, query };
}

/**
 * Traduce los filtros a condiciones del ORM.
 *
 * No incluye la condición de eliminación: esa vive en `property-scope.ts` y
 * la añade el repositorio, para que no haya dos sitios donde olvidarla.
 */
export function buildAdminPropertyWhere(query: AdminPropertyListQuery) {
  const conditions: Record<string, unknown> = {};
  const search = (query.search ?? "").trim();

  if (search) {
    const contains = { contains: search, mode: "insensitive" as const };

    conditions.OR = [
      { title: contains },
      { commune: contains },
      { city: contains },
    ];
  }

  const price = buildRange(query.minPrice, query.maxPrice);

  if (price) {
    conditions.price = price;
  }

  if (query.status === AdminPropertyStatus.PUBLISHED) {
    conditions.isPublished = true;
  }

  if (query.status === AdminPropertyStatus.DRAFT) {
    conditions.isPublished = false;
  }

  if (query.types && query.types.length > 0) {
    conditions.propertyType = { in: [...query.types] };
  }

  if (query.operations && query.operations.length > 0) {
    conditions.operationType = { in: [...query.operations] };
  }

  const publishedAt = buildDateRange(query.publishedFrom, query.publishedTo);

  if (publishedAt) {
    conditions.publishedAt = publishedAt;
  }

  return conditions;
}

function buildRange(minimum?: number, maximum?: number) {
  if (minimum === undefined && maximum === undefined) {
    return null;
  }

  return {
    ...(minimum === undefined ? {} : { gte: minimum }),
    ...(maximum === undefined ? {} : { lte: maximum }),
  };
}

/**
 * Rango de fechas de publicación.
 *
 * El extremo final es el día siguiente y se compara con `lt`, no con `lte`
 * sobre la fecha pedida: si no, «hasta el 31 de marzo» dejaría fuera todo lo
 * publicado ese mismo día después de la medianoche, que es casi todo.
 */
function buildDateRange(from?: string, to?: string) {
  if (from === undefined && to === undefined) {
    return null;
  }

  return {
    ...(from === undefined ? {} : { gte: new Date(`${from}T00:00:00.000Z`) }),
    ...(to === undefined
      ? {}
      : {
          lt: new Date(Date.parse(`${to}T00:00:00.000Z`) + DAY_IN_MILLISECONDS),
        }),
  };
}

/** Descarta vacíos y duplicados conservando el orden de aparición. */
function uniqueValues(values: readonly string[]): string[] {
  return [...new Set(values.filter((value) => value.trim() !== ""))];
}
