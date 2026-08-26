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
/**
 * Cuántas conexiones abre este proceso como mucho.
 *
 * `node-postgres` abre hasta diez por omisión y el *session pooler* de
 * Supabase admite quince en total, así que dos procesos bastan para agotarlo:
 * la base empieza a responder «max clients reached» y la aplicación devuelve
 * 500 sin que nada esté mal en el código. Ocurrió.
 *
 * Cinco deja sitio para varias instancias —en Vercel cada una lleva su propio
 * pool— sin quedarse corto para las consultas simultáneas de una sola.
 */
const MAX_CONEXIONES = 5;

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: resolveDatabaseUrl(),
      max: MAX_CONEXIONES,
    }),
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
