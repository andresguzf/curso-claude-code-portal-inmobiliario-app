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
