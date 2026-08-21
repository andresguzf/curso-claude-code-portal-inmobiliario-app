import { describe, expect, it } from "vitest";

import {
  buildAdminPropertyWhere,
  parseAdminPropertyListQuery,
} from "./admin-property-query";

function parse(queryString: string) {
  return parseAdminPropertyListQuery(new URLSearchParams(queryString));
}

function queryOf(queryString: string) {
  const result = parse(queryString);

  if (!result.ok) {
    throw new Error(`Se esperaba una consulta válida: ${result.message}`);
  }

  return result.query;
}

function rejectionOf(queryString: string): string {
  const result = parse(queryString);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

describe("parseAdminPropertyListQuery", () => {
  it("acepta una URL sin ningún parámetro", () => {
    expect(queryOf("")).toEqual({});
  });

  it("lee el rango de precio", () => {
    expect(queryOf("minPrice=1000&maxPrice=5000")).toMatchObject({
      minPrice: 1000,
      maxPrice: 5000,
    });
  });

  it("rechaza un rango de precio invertido", () => {
    // Devolvería siempre cero resultados sin explicar por qué.
    expect(rejectionOf("minPrice=5000&maxPrice=1000")).toBe(
      "El precio mínimo no puede superar al máximo.",
    );
  });

  it("rechaza un precio negativo o que no es número", () => {
    expect(rejectionOf("minPrice=-1")).toMatch(/no puede ser negativo/);
    expect(rejectionOf("maxPrice=barato")).toMatch(/debe ser un número/);
  });

  it("ignora un parámetro presente pero vacío", () => {
    // Es lo que deja un formulario enviado sin rellenar ese campo.
    expect(queryOf("minPrice=&status=&type=")).toEqual({});
  });

  it("lee el estado de publicación", () => {
    expect(queryOf("status=draft")).toMatchObject({ status: "draft" });
    expect(rejectionOf("status=archivada")).toBe(
      "El estado pedido no es válido.",
    );
  });

  it("admite varios tipos repitiendo el parámetro", () => {
    expect(queryOf("type=HOUSE&type=APARTMENT")).toMatchObject({
      types: ["HOUSE", "APARTMENT"],
    });
  });

  it("descarta tipos repetidos", () => {
    expect(queryOf("type=HOUSE&type=HOUSE")).toMatchObject({
      types: ["HOUSE"],
    });
  });

  it("rechaza un tipo o una operación que no existen", () => {
    expect(rejectionOf("type=CASTILLO")).toBe(
      "El tipo de propiedad no es válido.",
    );
    expect(rejectionOf("operation=PERMUTA")).toBe("La operación no es válida.");
  });

  it("lee el rango de fechas de publicación", () => {
    expect(
      queryOf("publishedFrom=2026-01-01&publishedTo=2026-03-31"),
    ).toMatchObject({ publishedFrom: "2026-01-01", publishedTo: "2026-03-31" });
  });

  it("rechaza una fecha con otro formato", () => {
    expect(rejectionOf("publishedFrom=01-01-2026")).toMatch(
      /debe ser una fecha AAAA-MM-DD/,
    );
    expect(rejectionOf("publishedTo=2026-13-45")).toMatch(
      /debe ser una fecha AAAA-MM-DD/,
    );
  });

  it("rechaza un rango de fechas invertido", () => {
    expect(rejectionOf("publishedFrom=2026-06-01&publishedTo=2026-01-01")).toBe(
      "La fecha inicial no puede ser posterior a la final.",
    );
  });

  it("exige que la página sea un entero mayor que cero", () => {
    expect(queryOf("page=3")).toMatchObject({ page: 3 });
    expect(rejectionOf("page=0")).toMatch(/entero mayor que cero/);
    expect(rejectionOf("page=1.5")).toMatch(/entero mayor que cero/);
  });
});

describe("buildAdminPropertyWhere", () => {
  it("no impone ninguna condición sin filtros", () => {
    expect(buildAdminPropertyWhere({})).toEqual({});
  });

  it("no incluye la condición de eliminación", () => {
    // Vive en `property-scope.ts` y la añade el repositorio: repartirla por
    // aquí es lo que se olvida en la siguiente consulta que alguien escriba.
    expect(buildAdminPropertyWhere({ status: "published" })).not.toHaveProperty(
      "deletedAt",
    );
  });

  it("traduce el estado a la columna booleana", () => {
    expect(buildAdminPropertyWhere({ status: "published" })).toMatchObject({
      isPublished: true,
    });
    expect(buildAdminPropertyWhere({ status: "draft" })).toMatchObject({
      isPublished: false,
    });
  });

  it("no filtra por estado cuando se piden ambas", () => {
    expect(buildAdminPropertyWhere({ status: "all" })).not.toHaveProperty(
      "isPublished",
    );
  });

  it("busca contra el texto normalizado, sin acentos", () => {
    // «nunoa» y «Ñuñoa» tienen que llegar a la misma condición.
    expect(buildAdminPropertyWhere({ search: "Ñuñoa" })).toEqual({
      searchText: { contains: "nunoa" },
    });
    expect(buildAdminPropertyWhere({ search: "nunoa" })).toEqual({
      searchText: { contains: "nunoa" },
    });
  });

  it("ignora una búsqueda de solo espacios", () => {
    expect(buildAdminPropertyWhere({ search: "   " })).toEqual({});
  });

  it("admite un solo extremo del rango de precio", () => {
    expect(buildAdminPropertyWhere({ minPrice: 1000 })).toMatchObject({
      price: { gte: 1000 },
    });
    expect(buildAdminPropertyWhere({ maxPrice: 1000 })).toMatchObject({
      price: { lte: 1000 },
    });
  });

  it("cubre el día entero del extremo final", () => {
    // Con `lte` sobre la fecha pedida quedaría fuera todo lo publicado ese
    // día después de la medianoche, que es casi todo.
    const where = buildAdminPropertyWhere({ publishedTo: "2026-03-31" });

    expect(where.publishedAt).toEqual({
      lt: new Date("2026-04-01T00:00:00.000Z"),
    });
  });

  it("toma el extremo inicial desde la medianoche", () => {
    expect(
      buildAdminPropertyWhere({ publishedFrom: "2026-03-01" }).publishedAt,
    ).toEqual({ gte: new Date("2026-03-01T00:00:00.000Z") });
  });

  it("combina todos los filtros a la vez", () => {
    const where = buildAdminPropertyWhere({
      search: "casa",
      minPrice: 100,
      status: "draft",
      types: ["HOUSE"],
      operations: ["SALE"],
      publishedFrom: "2026-01-01",
    });

    expect(Object.keys(where).sort()).toEqual([
      "isPublished",
      "operationType",
      "price",
      "propertyType",
      "publishedAt",
      "searchText",
    ]);
  });
});
