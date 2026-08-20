import { describe, expect, it } from "vitest";

import { validatePropertyInput } from "./admin-property-validation";

const VALID = {
  title: "Casa en Las Condes",
  description: "Amplia casa con jardín.",
  operationType: "SALE",
  propertyType: "HOUSE",
  price: 890000,
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

function rejectionOf(payload: unknown): string {
  const result = validatePropertyInput(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo y fue aceptada");
  }

  return result.message;
}

describe("validatePropertyInput", () => {
  it("acepta lo mínimo imprescindible", () => {
    const result = validatePropertyInput(VALID);

    expect(result).toMatchObject({
      ok: true,
      property: { title: "Casa en Las Condes", price: 890000 },
    });
  });

  it("nace despublicada y sin destacar salvo que se pida", () => {
    // Algo a medio escribir no debe aparecer en el portal por omisión.
    const result = validatePropertyInput(VALID);

    expect(result).toMatchObject({
      ok: true,
      property: { isPublished: false, isFeatured: false },
    });
  });

  it("deja en nulo los campos que esta propiedad no tiene", () => {
    // Un terreno sin dormitorios es un dato, no un olvido.
    const result = validatePropertyInput(VALID);

    expect(result).toMatchObject({
      ok: true,
      property: { bedrooms: null, bathrooms: null, ageYears: null },
    });
  });

  it("acepta números escritos como texto, que es como llegan de un formulario", () => {
    const result = validatePropertyInput({
      ...VALID,
      price: "890000",
      bedrooms: "4",
      usableAreaSquareMeters: "180.5",
    });

    expect(result).toMatchObject({
      ok: true,
      property: { price: 890000, bedrooms: 4, usableAreaSquareMeters: 180.5 },
    });
  });

  it("trata el texto vacío como campo sin dato", () => {
    const result = validatePropertyInput({ ...VALID, bedrooms: "" });

    expect(result).toMatchObject({ ok: true, property: { bedrooms: null } });
  });

  it("exige los campos obligatorios", () => {
    for (const field of [
      "title",
      "description",
      "address",
      "commune",
      "city",
      "region",
    ]) {
      expect(rejectionOf({ ...VALID, [field]: "  " })).toContain("obligatorio");
    }
  });

  it("rechaza una operación o un tipo desconocidos", () => {
    expect(rejectionOf({ ...VALID, operationType: "PERMUTA" })).toContain(
      "operación",
    );
    expect(rejectionOf({ ...VALID, propertyType: "CASTILLO" })).toContain(
      "tipo",
    );
  });

  it("exige un precio mayor que cero", () => {
    expect(rejectionOf({ ...VALID, price: 0 })).toContain("mayor que cero");
    expect(rejectionOf({ ...VALID, price: -1 })).toContain("mayor que cero");
    expect(rejectionOf({ ...VALID, price: "abc" })).toContain("mayor que cero");
  });

  it("rechaza un precio que la columna no admitiría", () => {
    // `Decimal(12, 2)`: dejarlo pasar sería un 500 en vez de un mensaje.
    expect(rejectionOf({ ...VALID, price: 10_000_000_000 })).toContain("alto");
  });

  it("exige enteros donde no cabe un decimal", () => {
    expect(rejectionOf({ ...VALID, bedrooms: 2.5 })).toContain("entero");
  });

  it("admite decimales en las superficies", () => {
    expect(
      validatePropertyInput({ ...VALID, usableAreaSquareMeters: 180.75 }).ok,
    ).toBe(true);
  });

  it("rechaza números negativos y desmedidos", () => {
    expect(rejectionOf({ ...VALID, bedrooms: -1 })).toContain("válido");
    expect(rejectionOf({ ...VALID, bedrooms: 101 })).toContain("máximo");
  });

  it("recorta los textos", () => {
    expect(
      validatePropertyInput({ ...VALID, title: "  Casa  " }),
    ).toMatchObject({ ok: true, property: { title: "Casa" } });
  });

  it("no admite características repetidas", () => {
    // Conectar dos veces la misma característica sería un error para Prisma.
    expect(
      validatePropertyInput({
        ...VALID,
        featureSlugs: ["piscina", "piscina", "quincho"],
      }),
    ).toMatchObject({
      ok: true,
      property: { featureSlugs: ["piscina", "quincho"] },
    });
  });

  it("acepta la ausencia de características", () => {
    expect(validatePropertyInput(VALID)).toMatchObject({
      ok: true,
      property: { featureSlugs: [] },
    });
  });

  it("rechaza unas características que no son una lista", () => {
    expect(rejectionOf({ ...VALID, featureSlugs: "piscina" })).toContain(
      "características",
    );
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    expect(rejectionOf(null)).toContain("inválido");
    expect(rejectionOf("texto")).toContain("inválido");
  });

  it("no acepta coordenadas: no forman parte del modelo", () => {
    const result = validatePropertyInput({
      ...VALID,
      latitude: -33.4,
      longitude: -70.5,
    });

    expect(result.ok).toBe(true);
    expect(result.ok && result.property).not.toHaveProperty("latitude");
    expect(result.ok && result.property).not.toHaveProperty("longitude");
  });
});
