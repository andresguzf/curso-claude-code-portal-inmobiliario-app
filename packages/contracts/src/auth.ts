import type { UserRoleValue } from "./domain";

/**
 * Contrato de autenticación (spec.md, sección 15).
 *
 * La contraseña solo viaja del navegador al servidor, nunca de vuelta: no
 * existe ningún DTO que la contenga en una respuesta. Del usuario autenticado
 * se devuelve lo justo para pintar la interfaz.
 */

export type RegisterRequestDto = {
  readonly name: string;
  readonly email: string;
  readonly password: string;
};

export type LoginRequestDto = {
  readonly email: string;
  readonly password: string;
};

/**
 * Cambios que alguien puede hacer sobre su propia cuenta.
 *
 * No incluye `role` ni `isActive` a propósito: quién es administrador y qué
 * cuentas están activas lo decide ADMIN (spec.md, sección 21). Que el campo
 * no exista en el contrato es la primera barrera; el backend además ignora
 * cualquier campo que no espere.
 */
export type UpdateAccountRequestDto = {
  readonly name: string;
  readonly email: string;
  /** Obligatoria: confirma que quien guarda es la persona dueña. */
  readonly currentPassword: string;
  /** Opcional: solo viaja cuando se quiere cambiar la contraseña. */
  readonly newPassword?: string | undefined;
};

/** Usuario autenticado, tal como lo ve el navegador. */
export type AuthenticatedUserDto = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRoleValue;
};

/**
 * Nombre de la cookie de sesión.
 *
 * Forma parte del contrato: la emite el backend y el frontend necesita
 * reconocerla para saber si merece la pena pedir la página protegida.
 */
export const SESSION_COOKIE_NAME = "portal_session";

/** Cotas de los campos, compartidas por el formulario y el backend. */
export const AUTH_LIMITS = {
  maxNameLength: 120,
  maxEmailLength: 160,
  /**
   * Ocho caracteres es el mínimo que recomienda el NIST. No se exigen
   * mayúsculas ni símbolos: esas reglas empujan a contraseñas predecibles y
   * el propio NIST desaconseja imponerlas.
   */
  minPasswordLength: 8,
  /**
   * El límite superior protege al servidor, no a la contraseña: derivar el
   * hash de un texto enorme es trabajo regalado a quien lo envía.
   */
  maxPasswordLength: 200,
} as const;

/**
 * Un usuario visto desde la administración (spec.md, sección 21).
 *
 * No lleva el hash de la contraseña ni ningún dato que ADMIN no necesite
 * para decidir: quién es, qué rol tiene, si puede entrar y desde cuándo.
 */
export type AdminUserDto = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: UserRoleValue;
  readonly isActive: boolean;
  readonly createdAt: string;
  /** Cuántas propiedades ha guardado. Ayuda a saber si la cuenta se usa. */
  readonly favoriteCount: number;
  /** Cuántas consultas ha enviado, incluidas las que ocultó de su historial. */
  readonly inquiryCount: number;
};

export type AdminUserPageDto = {
  readonly data: readonly AdminUserDto[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
};

/** Estado por el que se puede acotar el listado de usuarios. */
export const AdminUserStatus = {
  ALL: "all",
  ACTIVE: "active",
  INACTIVE: "inactive",
} as const;

export type AdminUserStatusValue =
  (typeof AdminUserStatus)[keyof typeof AdminUserStatus];

export function isAdminUserStatus(
  value: unknown,
): value is AdminUserStatusValue {
  return (
    typeof value === "string" &&
    Object.values<string>(AdminUserStatus).includes(value)
  );
}

/** Filtros del listado de usuarios. Viven en la URL, como en el catálogo. */
export type AdminUserListQuery = {
  readonly search?: string | undefined;
  readonly page?: number | undefined;
  readonly role?: UserRoleValue | undefined;
  readonly status?: AdminUserStatusValue | undefined;
};

export const ADMIN_USER_QUERY_PARAM_NAMES = {
  search: "search",
  page: "page",
  role: "role",
  status: "status",
} as const satisfies Record<keyof AdminUserListQuery, string>;

export const ADMIN_USERS_PER_PAGE = 10;

/**
 * Cambios que ADMIN hace sobre la cuenta de otra persona.
 *
 * Todos son opcionales: es un `PATCH`, y lo que no viaja no se toca.
 *
 * No se pide la contraseña actual, a diferencia de `UpdateAccountRequestDto`:
 * quien administra no la conoce. Es la contrapartida del rol, y por eso las
 * reglas que protegen la propia cuenta viven en el backend.
 */
export type AdminUpdateUserRequestDto = {
  readonly name?: string;
  readonly email?: string;
  readonly newPassword?: string;
  readonly role?: UserRoleValue;
  readonly isActive?: boolean;
};
