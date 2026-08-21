import { describe, expect, it } from "vitest";

import { FEATURE_LIMITS } from "@portal/contracts";

import { toFeatureSlug, validateFeatureInput } from "./feature-validation";

function rejectionOf(payload: unknown): string {
  const result = validateFeatureInput(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

function acceptedOf(payload: unknown) {
  const result = validateFeatureInput(payload);

  if (!result.ok) {
    throw new Error(`Se esperaba una característica válida: ${result.message}`);
  }

  return result;
}

describe("toFeatureSlug", () => {
  it("reproduce los identificadores que ya existen en la base", () => {
    // Los del seed. Inventar otro formato dejaría dos convenciones.
    expect(toFeatureSlug("Aire acondicionado")).toBe("aire-acondicionado");
    expect(toFeatureSlug("Pet friendly")).toBe("pet-friendly");
    expect(toFeatureSlug("Piscina")).toBe("piscina");
  });

  it("quita los acentos en vez de convertirlos en separadores", () => {
    // Sin normalizar antes, «Lavandería» daría `lavander-a`.
    expect(toFeatureSlug("Lavandería")).toBe("lavanderia");
    expect(toFeatureSlug("Conserjería")).toBe("conserjeria");
    expect(toFeatureSlug("Calefacción")).toBe("calefaccion");
  });

  it("no deja separadores sueltos en los extremos", () => {
    expect(toFeatureSlug("  Piscina temperada  ")).toBe("piscina-temperada");
    expect(toFeatureSlug("¡Quincho!")).toBe("quincho");
  });

  it("colapsa los separadores repetidos", () => {
    expect(toFeatureSlug("Sala   de    juegos")).toBe("sala-de-juegos");
  });

  it("conserva los números", () => {
    expect(toFeatureSlug("Estacionamiento 2")).toBe("estacionamiento-2");
  });
});

describe("validateFeatureInput", () => {
  it("acepta un nombre y deriva su identificador", () => {
    expect(acceptedOf({ name: "Piscina temperada" })).toMatchObject({
      name: "Piscina temperada",
      slug: "piscina-temperada",
    });
  });

  it("recorta y colapsa los espacios del nombre", () => {
    expect(acceptedOf({ name: "  Sala   de juegos " }).name).toBe(
      "Sala de juegos",
    );
  });

  it("exige un nombre", () => {
    expect(rejectionOf({ name: "   " })).toBe(
      "Falta el nombre de la característica.",
    );
    expect(rejectionOf({})).toBe("Falta el nombre de la característica.");
    expect(rejectionOf(null)).toBe("El cuerpo de la solicitud es inválido.");
  });

  it("rechaza un nombre demasiado largo", () => {
    const largo = "a".repeat(FEATURE_LIMITS.maxNameLength + 1);

    expect(rejectionOf({ name: largo })).toMatch(/supera los/);
  });

  it("acepta justo el largo máximo", () => {
    const justo = "a".repeat(FEATURE_LIMITS.maxNameLength);

    expect(acceptedOf({ name: justo }).name).toHaveLength(
      FEATURE_LIMITS.maxNameLength,
    );
  });

  it("rechaza un nombre sin letras ni números", () => {
    // Daría un identificador vacío, y dos así colisionarían entre sí.
    expect(rejectionOf({ name: "///" })).toMatch(/al menos una letra/);
  });
});
