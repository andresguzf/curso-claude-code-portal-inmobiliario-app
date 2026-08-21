import { describe, expect, it } from "vitest";

import { buildSearchConditions, parseSearchTerms } from "./property-search";

describe("parseSearchTerms", () => {
  it("devuelve una lista vacía cuando no hay búsqueda", () => {
    expect(parseSearchTerms(undefined)).toEqual([]);
    expect(parseSearchTerms(null)).toEqual([]);
    expect(parseSearchTerms("")).toEqual([]);
  });

  it("ignora una búsqueda de solo espacios", () => {
    expect(parseSearchTerms("   ")).toEqual([]);
  });

  it("separa la consulta en términos", () => {
    expect(parseSearchTerms("casa las condes")).toEqual([
      "casa",
      "las",
      "condes",
    ]);
  });

  it("colapsa espacios sobrantes y recorta los extremos", () => {
    expect(parseSearchTerms("  casa    condes ")).toEqual(["casa", "condes"]);
  });

  it("normaliza cada término como se guardó el texto", () => {
    // Si divergieran, lo escrito y lo buscado no se encontrarían.
    expect(parseSearchTerms("Ñuñoa Concón")).toEqual(["nunoa", "concon"]);
    expect(parseSearchTerms("LAS CONDES")).toEqual(["las", "condes"]);
  });

  it("acota el número de términos", () => {
    const terms = parseSearchTerms("a b c d e f g h i j k l");

    expect(terms.length).toBeLessThanOrEqual(8);
  });
});

describe("buildSearchConditions", () => {
  it("no produce condiciones cuando no hay términos", () => {
    expect(buildSearchConditions([])).toEqual([]);
  });

  it("busca contra el texto normalizado de la propiedad", () => {
    // Ahí están reunidos título, ubicación y descripción sin acentos.
    expect(buildSearchConditions(["providencia"])).toEqual([
      { searchText: { contains: "providencia" } },
    ]);
  });

  it("no necesita comparar ignorando mayúsculas", () => {
    // Lo guardado y lo buscado ya están en minúsculas.
    const [condition] = buildSearchConditions(["providencia"]);

    expect(condition?.searchText).not.toHaveProperty("mode");
  });

  it("produce una condición por término, para acotar al agregar palabras", () => {
    expect(buildSearchConditions(["casa", "condes"])).toEqual([
      { searchText: { contains: "casa" } },
      { searchText: { contains: "condes" } },
    ]);
  });
});
