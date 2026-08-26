import { describe, expect, it } from "vitest";

import { buildPageRange, PAGE_GAP } from "@/components/ui/page-range";

describe("buildPageRange", () => {
  it("con pocas páginas las enumera todas, sin separadores", () => {
    expect(buildPageRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
  });

  it("siempre incluye la primera y la última", () => {
    const items = buildPageRange(20, 40);

    expect(items[0]).toBe(1);
    expect(items.at(-1)).toBe(40);
  });

  it("muestra tres a cada lado de la actual", () => {
    const items = buildPageRange(20, 40);

    expect(items).toEqual([1, PAGE_GAP, 17, 18, 19, 20, 21, 22, 23, PAGE_GAP, 40]);
  });

  it("no abre separador cuando solo falta una página", () => {
    // «1 … 3» ocupa lo mismo que «1 2 3» y esconde una página por nada.
    expect(buildPageRange(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("al principio no separa por la izquierda", () => {
    expect(buildPageRange(1, 40)).toEqual([1, 2, 3, 4, PAGE_GAP, 40]);
  });

  it("al final no separa por la derecha", () => {
    expect(buildPageRange(40, 40)).toEqual([1, PAGE_GAP, 37, 38, 39, 40]);
  });

  it("nunca repite una página", () => {
    for (const actual of [1, 2, 7, 19, 20]) {
      const items = buildPageRange(actual, 20).filter(
        (item): item is number => item !== PAGE_GAP,
      );

      expect(new Set(items).size).toBe(items.length);
    }
  });

  it("las devuelve en orden creciente", () => {
    const numeros = buildPageRange(15, 30).filter(
      (item): item is number => item !== PAGE_GAP,
    );

    expect(numeros).toEqual([...numeros].sort((a, b) => a - b));
  });

  it("una sola página se reduce a ella", () => {
    expect(buildPageRange(1, 1)).toEqual([1]);
  });

  it("aguanta una página fuera de rango sin romperse", () => {
    // La validación del backend ya rechaza lo imposible; esto es la red.
    expect(buildPageRange(999, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageRange(0, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPageRange(1, 0)).toEqual([]);
  });
});
