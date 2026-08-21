import {
  ADMIN_USER_QUERY_PARAM_NAMES,
  AdminUserStatus,
  MAX_SEARCH_LENGTH,
  UserRole,
  isAdminUserStatus,
  normalizeSearchText,
  type AdminUserListQuery,
  type UserRoleValue,
} from "@portal/contracts";

/**
 * Lectura y traducción de los filtros del listado de usuarios
 * (spec.md, sección 21).
 *
 * Módulo puro, como `admin-property-query.ts`: no importa Prisma ni
 * `server-only`, para poder probar las reglas sin base de datos.
 */

export type AdminUserQueryParseResult =
  | { readonly ok: true; readonly query: AdminUserListQuery }
  | { readonly ok: false; readonly message: string };

type QueryReader = {
  get: (name: string) => string | null;
};

function isUserRole(value: unknown): value is UserRoleValue {
  return (
    typeof value === "string" && Object.values<string>(UserRole).includes(value)
  );
}

export function parseAdminUserListQuery(
  searchParams: QueryReader,
): AdminUserQueryParseResult {
  const query: {
    -readonly [Key in keyof AdminUserListQuery]: AdminUserListQuery[Key];
  } = {};

  const search = searchParams.get(ADMIN_USER_QUERY_PARAM_NAMES.search);

  if (search !== null) {
    if (search.length > MAX_SEARCH_LENGTH) {
      return {
        ok: false,
        message: `La búsqueda no puede superar ${MAX_SEARCH_LENGTH} caracteres.`,
      };
    }

    query.search = search;
  }

  const page = searchParams.get(ADMIN_USER_QUERY_PARAM_NAMES.page);

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

  const role = searchParams.get(ADMIN_USER_QUERY_PARAM_NAMES.role);

  if (role !== null && role !== "") {
    if (!isUserRole(role)) {
      return { ok: false, message: "El rol pedido no es válido." };
    }

    query.role = role;
  }

  const status = searchParams.get(ADMIN_USER_QUERY_PARAM_NAMES.status);

  if (status !== null && status !== "") {
    if (!isAdminUserStatus(status)) {
      return { ok: false, message: "El estado pedido no es válido." };
    }

    query.status = status;
  }

  return { ok: true, query };
}

/** Traduce los filtros a condiciones del ORM. */
export function buildAdminUserWhere(query: AdminUserListQuery) {
  const conditions: Record<string, unknown> = {};
  const search = (query.search ?? "").trim();

  if (search) {
    // Nombre y email, ambos en la copia normalizada: «peres» encuentra a
    // «Pérez».
    conditions.searchText = { contains: normalizeSearchText(search) };
  }

  if (query.role) {
    conditions.role = query.role;
  }

  if (query.status === AdminUserStatus.ACTIVE) {
    conditions.isActive = true;
  }

  if (query.status === AdminUserStatus.INACTIVE) {
    conditions.isActive = false;
  }

  return conditions;
}
