import { describe, expect, it } from "vitest";

import {
  SEARCHABLE_FIELDS,
  buildSearchConditions,
  parseSearchTerms,
} from "./property-search";

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

  it("acota el número de términos", () => {
    const terms = parseSearchTerms("a b c d e f g h i j k l");

    expect(terms.length).toBeLessThanOrEqual(8);
  });
});

describe("buildSearchConditions", () => {
  it("no produce condiciones cuando no hay términos", () => {
    expect(buildSearchConditions([])).toEqual([]);
  });

  it("busca en los cinco campos que exige la especificación", () => {
    const [condition] = buildSearchConditions(["providencia"]);
    const fields = condition?.OR.flatMap((entry) => Object.keys(entry));

    expect(fields).toEqual([
      "title",
      "commune",
      "city",
      "region",
      "description",
    ]);
    expect(SEARCHABLE_FIELDS).toHaveLength(5);
  });

  it("busca sin distinguir mayúsculas", () => {
    const [condition] = buildSearchConditions(["Providencia"]);

    for (const entry of condition?.OR ?? []) {
      expect(Object.values(entry)[0]).toEqual({
        contains: "Providencia",
        mode: "insensitive",
      });
    }
  });

  it("produce una condición por término, para acotar al agregar palabras", () => {
    const conditions = buildSearchConditions(["casa", "condes"]);

    expect(conditions).toHaveLength(2);
    expect(conditions[0]?.OR[0]).toEqual({
      title: { contains: "casa", mode: "insensitive" },
    });
    expect(conditions[1]?.OR[0]).toEqual({
      title: { contains: "condes", mode: "insensitive" },
    });
  });
});
