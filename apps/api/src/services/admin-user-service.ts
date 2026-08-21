import "server-only";

import {
  ADMIN_USERS_PER_PAGE,
  UserRole,
  type AdminUserDto,
  type AdminUserListQuery,
  type AdminUserPageDto,
} from "@portal/contracts";

import { hashPassword } from "@/lib/password";
import {
  findAdminUserById,
  findAdminUsers,
  findUserByEmail,
  updateUserAsAdmin,
} from "@/repositories/user-repository";
import { buildAdminUserWhere } from "@/services/admin-user-query";
import { validateAdminUserUpdate } from "@/services/admin-user-validation";

/**
 * Administración de usuarios (spec.md, sección 21).
 *
 * ADMIN puede editar a cualquiera, incluidos su nombre, su email y su
 * contraseña. No se le pide la contraseña actual de la otra persona porque no
 * la conoce: es la contrapartida del rol.
 *
 * Sobre su **propia** cuenta no puede desactivarse ni dejar de ser ADMIN. El
 * registro público solo crea cuentas `USER`, así que hacerlo dejaría el
 * portal sin nadie que lo administre y sin forma de recuperarlo desde la
 * propia aplicación. La regla vive aquí, en el backend, no en si la interfaz
 * pinta o no el control.
 */

type AdminUserRecord = {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: "USER" | "ADMIN";
  readonly isActive: boolean;
  readonly createdAt: Date;
  readonly _count: {
    readonly favorites: number;
    readonly inquiries: number;
  };
};

export type UserMutationOutcome =
  | { readonly status: "ok"; readonly user: AdminUserDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "forbidden"; readonly message: string }
  | { readonly status: "duplicate"; readonly message: string }
  | { readonly status: "not-found" };

export async function listAdminUsers(
  query: AdminUserListQuery = {},
): Promise<AdminUserPageDto> {
  const page = normalizePage(query.page);

  const { users, total } = await findAdminUsers({
    filters: buildAdminUserWhere(query),
    skip: (page - 1) * ADMIN_USERS_PER_PAGE,
    take: ADMIN_USERS_PER_PAGE,
  });

  return {
    data: users.map(toAdminUser),
    total,
    page,
    pageSize: ADMIN_USERS_PER_PAGE,
  };
}

export async function getAdminUser(id: string): Promise<AdminUserDto | null> {
  const user = await findAdminUserById(id);

  return user ? toAdminUser(user) : null;
}

/**
 * Aplica los cambios de ADMIN sobre una cuenta.
 *
 * `adminId` es quien hace la petición, y sale siempre de la sesión: es lo que
 * permite distinguir «editar a otro» de «editarse a sí mismo».
 */
export async function updateUserAsAdministrator(
  adminId: string,
  targetId: string,
  payload: unknown,
): Promise<UserMutationOutcome> {
  const validation = validateAdminUserUpdate(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const target = await findAdminUserById(targetId);

  if (!target) {
    return { status: "not-found" };
  }

  const { changes } = validation;

  if (targetId === adminId) {
    if (changes.isActive === false) {
      return {
        status: "forbidden",
        message:
          "No puedes desactivar tu propia cuenta: el portal se quedaría sin administración.",
      };
    }

    if (changes.role !== undefined && changes.role !== UserRole.ADMIN) {
      return {
        status: "forbidden",
        message:
          "No puedes quitarte el rol de administración: nadie podría devolvértelo desde la aplicación.",
      };
    }
  }

  if (changes.email !== undefined) {
    const owner = await findUserByEmail(changes.email);

    // Que el email siga siendo el suyo no es un choque.
    if (owner && owner.id !== targetId) {
      return {
        status: "duplicate",
        message: "Ese email ya pertenece a otra cuenta.",
      };
    }
  }

  const updated = await updateUserAsAdmin(targetId, {
    ...(changes.name === undefined ? {} : { name: changes.name }),
    ...(changes.email === undefined ? {} : { email: changes.email }),
    ...(changes.role === undefined ? {} : { role: changes.role }),
    ...(changes.isActive === undefined ? {} : { isActive: changes.isActive }),
    ...(changes.newPassword === undefined
      ? {}
      : { passwordHash: await hashPassword(changes.newPassword) }),
  });

  return { status: "ok", user: toAdminUser(updated) };
}

function toAdminUser(user: AdminUserRecord): AdminUserDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    favoriteCount: user._count.favorites,
    inquiryCount: user._count.inquiries,
  };
}

/** Una página fuera de rango se trata como la primera. */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}
