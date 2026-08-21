import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Acceso a la tabla `users`.
 *
 * Esta capa solo consulta PostgreSQL. No decide si alguien puede entrar: esa
 * regla vive en la capa de servicios (plan.md, sección 8).
 *
 * El correo se guarda y se busca en minúsculas. PostgreSQL distingue
 * mayúsculas en un índice único, así que sin normalizar podrían coexistir
 * `Ana@example.com` y `ana@example.com` como dos cuentas distintas.
 */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
}

export function findUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(user: {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
}) {
  return prisma.user.create({
    data: { ...user, email: normalizeEmail(user.email) },
  });
}

/**
 * Actualiza los datos que alguien puede cambiar de su propia cuenta.
 *
 * La firma no admite `role` ni `isActive`: no es que se filtren, es que no
 * hay forma de pasarlos por aquí.
 */
export function updateUser(
  id: string,
  changes: {
    readonly name: string;
    readonly email: string;
    readonly passwordHash?: string;
  },
) {
  return prisma.user.update({
    where: { id },
    data: { ...changes, email: normalizeEmail(changes.email) },
  });
}

/**
 * Datos que la administración necesita de cada cuenta.
 *
 * Nunca el hash de la contraseña: no hay motivo para que salga de aquí, y
 * omitirlo en el `select` es más seguro que confiar en que nadie lo mapee.
 */
const adminUserSelection = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: { select: { favorites: true, inquiries: true } },
} as const;

export async function findAdminUsers(options: {
  /** Condiciones ya traducidas por `admin-user-query.ts`. */
  readonly filters: Record<string, unknown>;
  readonly skip: number;
  readonly take: number;
}) {
  const where = options.filters;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: adminUserSelection,
      // Lo más reciente primero, como el resto de listados del panel.
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.user.count({ where }),
  ]);

  return { users, total };
}

export function findAdminUserById(id: string) {
  return prisma.user.findUnique({ where: { id }, select: adminUserSelection });
}

/**
 * Da de alta una cuenta desde la administración.
 *
 * A diferencia de `createUser`, que sirve al registro público, esta firma sí
 * admite `role` e `isActive`. Quién puede usarla lo decide la guarda del
 * Route Handler.
 */
export function createUserAsAdmin(user: {
  readonly name: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly role: "USER" | "ADMIN";
  readonly isActive: boolean;
}) {
  return prisma.user.create({
    data: { ...user, email: normalizeEmail(user.email) },
    select: adminUserSelection,
  });
}

/**
 * Aplica los cambios que hace la administración sobre una cuenta.
 *
 * A diferencia de `updateUser`, esta firma sí admite `role` e `isActive`.
 * Quién puede usarla, y sobre quién, lo decide la capa de servicios: aquí
 * solo se escribe.
 */
export function updateUserAsAdmin(
  id: string,
  changes: {
    readonly name?: string;
    readonly email?: string;
    readonly passwordHash?: string;
    readonly role?: "USER" | "ADMIN";
    readonly isActive?: boolean;
  },
) {
  return prisma.user.update({
    where: { id },
    data: {
      ...changes,
      ...(changes.email === undefined
        ? {}
        : { email: normalizeEmail(changes.email) }),
    },
    select: adminUserSelection,
  });
}
