const POSTGRESQL_URL_PREFIXES = ["postgresql://", "postgres://"] as const;

/**
 * Valida la cadena de conexión de PostgreSQL.
 *
 * Se valida el prefijo porque PostgreSQL es la única base de datos admitida
 * por la aplicación (ver `plan.md`, sección 6): una URL de otro motor debe
 * fallar de inmediato y con un mensaje claro, no al ejecutar la primera
 * consulta.
 */
export function resolveDatabaseUrl(
  rawConnectionString: string | undefined = process.env.DATABASE_URL,
): string {
  const connectionString = rawConnectionString?.trim();

  if (!connectionString) {
    throw new Error(
      "Falta la variable de entorno DATABASE_URL. Revisa `.env.example`.",
    );
  }

  const isPostgresqlUrl = POSTGRESQL_URL_PREFIXES.some((prefix) =>
    connectionString.startsWith(prefix),
  );

  if (!isPostgresqlUrl) {
    throw new Error(
      "DATABASE_URL debe ser una cadena de conexión de PostgreSQL " +
        "(postgresql:// o postgres://).",
    );
  }

  return connectionString;
}
