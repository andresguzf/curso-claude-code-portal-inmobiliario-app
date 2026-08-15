import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveDatabaseUrl } from "./database-url";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("resolveDatabaseUrl", () => {
  it("devuelve la cadena de conexión de PostgreSQL", () => {
    const connectionString =
      "postgresql://postgres:postgres@localhost:5432/portal_inmobiliario?schema=public";

    expect(resolveDatabaseUrl(connectionString)).toBe(connectionString);
  });

  it("admite el prefijo abreviado postgres://", () => {
    const connectionString = "postgres://postgres@localhost:5432/portal";

    expect(resolveDatabaseUrl(connectionString)).toBe(connectionString);
  });

  it("elimina los espacios sobrantes", () => {
    expect(resolveDatabaseUrl("  postgresql://localhost:5432/portal  ")).toBe(
      "postgresql://localhost:5432/portal",
    );
  });

  it("falla cuando la variable no está definida o está vacía", () => {
    vi.stubEnv("DATABASE_URL", "");

    expect(() => resolveDatabaseUrl()).toThrow(/Falta la variable/);
    expect(() => resolveDatabaseUrl("   ")).toThrow(/Falta la variable/);
  });

  it("toma DATABASE_URL del entorno cuando no se pasa argumento", () => {
    vi.stubEnv("DATABASE_URL", "postgresql://localhost:5432/desde_entorno");

    expect(resolveDatabaseUrl()).toBe(
      "postgresql://localhost:5432/desde_entorno",
    );
  });

  it("rechaza motores de base de datos distintos de PostgreSQL", () => {
    expect(() =>
      resolveDatabaseUrl("mysql://root@localhost:3306/portal"),
    ).toThrow(/PostgreSQL/);
  });
});
