import { describe, expect, it } from "vitest";

import { buildFullAddress, buildMapAddress } from "./location";

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("buildFullAddress", () => {
  it("encadena dirección, comuna, ciudad y región", () => {
    expect(buildFullAddress(LAS_CONDES)).toBe(
      "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana",
    );
  });

  it("no repite una parte que se llama igual que otra", () => {
    expect(
      buildFullAddress({
        address: "Calle Prat 100",
        commune: "Valparaíso",
        city: "Valparaíso",
        region: "Región de Valparaíso",
      }),
    ).toBe("Calle Prat 100, Valparaíso, Región de Valparaíso");
  });

  it("omite las partes vacías o en blanco", () => {
    expect(
      buildFullAddress({
        address: "Camino Rural s/n",
        commune: "Pirque",
        city: "   ",
        region: "Región Metropolitana",
      }),
    ).toBe("Camino Rural s/n, Pirque, Región Metropolitana");
  });
});

describe("buildMapAddress", () => {
  it("añade el país para que la geocodificación no sea ambigua", () => {
    expect(buildMapAddress(LAS_CONDES)).toBe(
      "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana, Chile",
    );
  });

  it("devuelve solo el país cuando no hay ninguna otra parte", () => {
    expect(
      buildMapAddress({ address: "", commune: "", city: "", region: "" }),
    ).toBe("Chile");
  });
});
