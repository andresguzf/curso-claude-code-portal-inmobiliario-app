import { describe, expect, it } from "vitest";

import { buildSearchText, normalizeSearchText } from "./text";

describe("normalizeSearchText", () => {
  it("quita los acentos", () => {
    expect(normalizeSearchText("Concón")).toBe("concon");
    expect(normalizeSearchText("Región Metropolitana")).toBe(
      "region metropolitana",
    );
  });

  it("convierte la eñe en ene", () => {
    // «montana» tiene que encontrar «montaña».
    expect(normalizeSearchText("Montaña")).toBe("montana");
    expect(normalizeSearchText("Ñuñoa")).toBe("nunoa");
  });

  it("no distingue mayúsculas", () => {
    expect(normalizeSearchText("LAS CONDES")).toBe("las condes");
  });

  it("colapsa los espacios y recorta los extremos", () => {
    expect(normalizeSearchText("  Las   Condes  ")).toBe("las condes");
  });

  it("conserva los números y los signos", () => {
    expect(normalizeSearchText("Av. Apoquindo 3000")).toBe(
      "av. apoquindo 3000",
    );
  });

  it("deja igual lo que ya está normalizado", () => {
    expect(normalizeSearchText("casa en nunoa")).toBe("casa en nunoa");
  });

  it("es idempotente", () => {
    // Normalizar dos veces no puede cambiar el resultado, o lo guardado y lo
    // buscado dejarían de coincidir.
    const una = normalizeSearchText("Ñuñoa, Región Metropolitana");

    expect(normalizeSearchText(una)).toBe(una);
  });
});

describe("buildSearchText", () => {
  it("une los campos con un espacio", () => {
    expect(buildSearchText("Casa en Ñuñoa", "Ñuñoa", "Santiago")).toBe(
      "casa en nunoa nunoa santiago",
    );
  });

  it("descarta lo que no tiene valor", () => {
    expect(buildSearchText("Casa", null, undefined, "", "Ñuñoa")).toBe(
      "casa nunoa",
    );
  });

  it("devuelve cadena vacía sin ningún campo", () => {
    expect(buildSearchText(null, undefined)).toBe("");
  });
});
