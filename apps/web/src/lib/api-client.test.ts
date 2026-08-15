import { describe, expect, it } from "vitest";

import { buildApiUrl, resolveApiBaseUrl } from "./api-client";

const IN_BROWSER = true;
const ON_SERVER = false;

describe("resolveApiBaseUrl", () => {
  it("usa rutas relativas en el navegador, para que el proxy las reescriba", () => {
    expect(resolveApiBaseUrl(undefined, IN_BROWSER)).toBe("");
    expect(resolveApiBaseUrl("http://localhost:3001", IN_BROWSER)).toBe("");
  });

  it("apunta directo al backend en el servidor", () => {
    expect(resolveApiBaseUrl("http://localhost:3001", ON_SERVER)).toBe(
      "http://localhost:3001",
    );
  });

  it("elimina las barras finales", () => {
    expect(resolveApiBaseUrl("http://localhost:3001///", ON_SERVER)).toBe(
      "http://localhost:3001",
    );
  });

  it("falla en el servidor con un mensaje accionable si falta la variable", () => {
    expect(() => resolveApiBaseUrl("", ON_SERVER)).toThrow(/API_INTERNAL_URL/);
    expect(() => resolveApiBaseUrl("   ", ON_SERVER)).toThrow(
      /API_INTERNAL_URL/,
    );
  });
});

describe("buildApiUrl", () => {
  it("compone la URL absoluta del endpoint en el servidor", () => {
    expect(buildApiUrl("/api/properties", "http://localhost:3001")).toBe(
      "http://localhost:3001/api/properties",
    );
  });

  it("deja la ruta relativa cuando la base está vacía", () => {
    expect(buildApiUrl("/api/properties", "")).toBe("/api/properties");
  });

  it("acepta rutas sin barra inicial", () => {
    expect(buildApiUrl("api/properties", "http://localhost:3001")).toBe(
      "http://localhost:3001/api/properties",
    );
  });

  it("no duplica la barra cuando la base termina en una", () => {
    expect(buildApiUrl("/api/properties", "http://localhost:3001/")).toBe(
      "http://localhost:3001/api/properties",
    );
  });
});
