import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/generated/prisma/client";
import { resolveDatabaseUrl } from "@/lib/database-url";

/**
 * Cliente de Prisma compartido.
 *
 * En desarrollo Next.js recarga los módulos en caliente, lo que crearía una
 * nueva instancia (y un nuevo pool de conexiones) en cada recarga. Por eso la
 * instancia se cachea en `globalThis`.
 *
 * Este módulo es exclusivo del servidor: solo debe importarse desde
 * repositorios y Route Handlers, nunca desde componentes de cliente.
 */
function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: resolveDatabaseUrl() }),
  });
}

const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient | undefined;
};

export const prisma: PrismaClient =
  globalForPrisma.prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prismaClient = prisma;
}
