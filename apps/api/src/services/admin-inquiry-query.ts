import {
  ADMIN_INQUIRY_QUERY_PARAM_NAMES,
  MAX_SEARCH_LENGTH,
  type AdminInquiryListQuery,
} from "@portal/contracts";

/**
 * Lectura y traducción de los filtros del listado de consultas
 * (spec.md, sección 22).
 *
 * Módulo puro, como los otros dos: no importa Prisma ni `server-only`, para
 * poder probar las reglas sin base de datos.
 */

export type AdminInquiryQueryParseResult =
  | { readonly ok: true; readonly query: AdminInquiryListQuery }
  | { readonly ok: false; readonly message: string };

type QueryReader = {
  get: (name: string) => string | null;
};

export function parseAdminInquiryListQuery(
  searchParams: QueryReader,
): AdminInquiryQueryParseResult {
  const query: {
    -readonly [Key in keyof AdminInquiryListQuery]: AdminInquiryListQuery[Key];
  } = {};

  const search = searchParams.get(ADMIN_INQUIRY_QUERY_PARAM_NAMES.search);

  if (search !== null) {
    if (search.length > MAX_SEARCH_LENGTH) {
      return {
        ok: false,
        message: `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
      };
    }

    query.search = search;
  }

  const page = searchParams.get(ADMIN_INQUIRY_QUERY_PARAM_NAMES.page);

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

  return { ok: true, query };
}

/**
 * Traduce la búsqueda a condiciones del ORM.
 *
 * Mira las cuatro formas de recordar una consulta: quién escribió, con qué
 * email, qué dijo y sobre qué propiedad.
 *
 * **No** filtra por `hiddenByUserAt` ni por el estado de la propiedad: aquí
 * se ven todas. Es lo contrario del historial propio, y el motivo por el que
 * aquel borrado es lógico.
 */
export function buildAdminInquiryWhere(query: AdminInquiryListQuery) {
  const search = (query.search ?? "").trim();

  if (!search) {
    return {};
  }

  const contains = { contains: search, mode: "insensitive" as const };

  return {
    OR: [
      { name: contains },
      { email: contains },
      { message: contains },
      { property: { title: contains } },
    ],
  };
}
