import { describe, expect, it } from "vitest";

import { QUERY_PARAM_NAMES } from "@portal/contracts";

import {
  buildAdminPropertyQueryString,
  buildApiUrl,
  buildPropertyQueryString,
  resolveApiBaseUrl,
} from "./api-client";

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

describe("buildPropertyQueryString", () => {
  it("no añade nada cuando no hay parámetros", () => {
    expect(buildPropertyQueryString({})).toBe("");
  });

  it("omite una búsqueda vacía en lugar de dejar ?search=", () => {
    expect(buildPropertyQueryString({ search: "" })).toBe("");
    expect(buildPropertyQueryString({ search: "   " })).toBe("");
    expect(buildPropertyQueryString({ search: undefined })).toBe("");
  });

  it("serializa la búsqueda", () => {
    expect(buildPropertyQueryString({ search: "providencia" })).toBe(
      "?search=providencia",
    );
  });

  it("recorta los espacios de los extremos", () => {
    expect(buildPropertyQueryString({ search: "  las condes  " })).toBe(
      "?search=las+condes",
    );
  });

  it("serializa el criterio de ordenamiento", () => {
    expect(buildPropertyQueryString({ sort: "price-asc" })).toBe(
      "?sort=price-asc",
    );
  });

  it("serializa los filtros múltiples repitiendo el parámetro", () => {
    const queryString = buildPropertyQueryString({
      communes: ["Las Condes", "Providencia"],
      types: ["HOUSE", "APARTMENT"],
      operations: ["SALE"],
    });
    const params = new URLSearchParams(queryString);

    expect(params.getAll("commune")).toEqual(["Las Condes", "Providencia"]);
    expect(params.getAll("type")).toEqual(["HOUSE", "APARTMENT"]);
    expect(params.getAll("operation")).toEqual(["SALE"]);
  });

  it("omite las listas vacías", () => {
    expect(buildPropertyQueryString({ communes: [], types: [] })).toBe("");
  });

  /**
   * Sin esta prueba un parámetro nuevo del contrato podía quedar sin
   * serializar y la interfaz mostraría resultados que no corresponden a lo
   * pedido, sin error visible.
   */
  it("serializa todos los parámetros que declara el contrato", () => {
    const queryString = buildPropertyQueryString({
      search: "parque",
      operations: ["SALE"],
      types: ["HOUSE"],
      minPrice: 100,
      maxPrice: 900,
      bedrooms: 2,
      bathrooms: 1,
      minUsableArea: 50,
      communes: ["Ñuñoa"],
      city: "Santiago",
      region: "Región Metropolitana",
      sort: "price-desc",
      page: 3,
    });
    const params = new URLSearchParams(queryString);

    for (const paramName of Object.values(QUERY_PARAM_NAMES)) {
      expect(params.has(paramName), `falta «${paramName}»`).toBe(true);
    }
  });

  it("codifica acentos y caracteres especiales", () => {
    expect(buildPropertyQueryString({ search: "Ñuñoa" })).toBe(
      "?search=%C3%91u%C3%B1oa",
    );
    expect(buildPropertyQueryString({ search: "a&b=c" })).toBe(
      "?search=a%26b%3Dc",
    );
  });
});

describe("buildAdminPropertyQueryString", () => {
  function build(queryString: string): string {
    return buildAdminPropertyQueryString(new URLSearchParams(queryString));
  }

  it("no produce nada cuando no hay filtros", () => {
    expect(build("")).toBe("");
  });

  it("reenvía los filtros que el listado entiende", () => {
    const query = new URLSearchParams(
      build("status=draft&minPrice=1000&publishedFrom=2026-01-01"),
    );

    expect(query.get("status")).toBe("draft");
    expect(query.get("minPrice")).toBe("1000");
    expect(query.get("publishedFrom")).toBe("2026-01-01");
  });

  it("conserva los valores repetidos de tipo y operación", () => {
    const query = new URLSearchParams(build("type=HOUSE&type=APARTMENT"));

    expect(query.getAll("type")).toEqual(["HOUSE", "APARTMENT"]);
  });

  it("descarta lo que el listado no conoce", () => {
    // Un parámetro ajeno en la URL no tiene por qué llegar a la API.
    expect(build("utm_source=correo&orden=magica")).toBe("");
  });

  it("omite los parámetros vacíos", () => {
    expect(build("status=&minPrice=&search=")).toBe("");
  });

  it("no interpreta los valores: de eso responde el backend", () => {
    // Un filtro escrito a mano debe producir su 400, no descartarse en
    // silencio y devolver un listado que no corresponde a lo pedido.
    expect(build("status=archivada")).toBe("?status=archivada");
  });
});
