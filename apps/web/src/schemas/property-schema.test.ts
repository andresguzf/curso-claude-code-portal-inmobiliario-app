import { describe, expect, it } from "vitest";

import {
  propertyFormSchema,
  toPropertyInput,
  type PropertyFormValues,
} from "./property-schema";

/** Formulario válido mínimo, sobre el que cada prueba cambia lo suyo. */
function buildValues(
  overrides: Partial<PropertyFormValues> = {},
): PropertyFormValues {
  return {
    title: "Casa en Ñuñoa",
    description: "Una casa con patio.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: "250000",
    usableAreaSquareMeters: "",
    totalAreaSquareMeters: "",
    bedrooms: "",
    bathrooms: "",
    parkingSpaces: "",
    ageYears: "",
    address: "Av. Siempre Viva 742",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    featureSlugs: [],
    isPublished: false,
    isFeatured: false,
    ...overrides,
  };
}

function firstError(values: PropertyFormValues): string | undefined {
  const result = propertyFormSchema.safeParse(values);

  return result.success ? undefined : result.error.issues[0]?.message;
}

describe("propertyFormSchema", () => {
  it("acepta una propiedad sin ningún dato opcional", () => {
    expect(propertyFormSchema.safeParse(buildValues()).success).toBe(true);
  });

  it("exige los campos de texto obligatorios", () => {
    expect(firstError(buildValues({ title: "   " }))).toBe("Falta el título.");
    // La frase se construye alrededor del artículo: «La comuna es
    // obligatorio» concordaría mal.
    expect(firstError(buildValues({ commune: "" }))).toBe("Falta la comuna.");
  });

  it("rechaza un precio de cero o negativo", () => {
    expect(firstError(buildValues({ price: "0" }))).toBe(
      "El precio debe ser mayor que cero.",
    );
    expect(firstError(buildValues({ price: "-1" }))).toBe(
      "El precio debe ser mayor que cero.",
    );
  });

  it("exige el precio, que no es opcional", () => {
    expect(firstError(buildValues({ price: "" }))).toBe("Falta el precio.");
  });

  it("admite cero en un campo opcional", () => {
    // Una propiedad por estrenar tiene cero años de antigüedad, y eso es un
    // dato, no un vacío.
    expect(
      propertyFormSchema.safeParse(buildValues({ ageYears: "0" })).success,
    ).toBe(true);
  });

  it("exige que dormitorios y baños sean enteros", () => {
    expect(firstError(buildValues({ bedrooms: "2.5" }))).toBe(
      "Los dormitorios debe ser un número entero.",
    );
  });

  it("admite decimales en las superficies", () => {
    expect(
      propertyFormSchema.safeParse(
        buildValues({ usableAreaSquareMeters: "85.5" }),
      ).success,
    ).toBe(true);
  });

  it("rechaza lo que no es un número", () => {
    expect(firstError(buildValues({ bathrooms: "dos" }))).toBe(
      "Los baños debe ser un número.",
    );
  });

  it("rechaza un valor por encima del máximo de la columna", () => {
    expect(firstError(buildValues({ ageYears: "5000" }))).toBe(
      "La antigüedad supera el máximo permitido.",
    );
  });
});

describe("toPropertyInput", () => {
  it("convierte un campo opcional vacío en nulo, no en cero", () => {
    // «Sin dormitorios declarados» y «cero dormitorios» son cosas distintas.
    const input = toPropertyInput(buildValues());

    expect(input.bedrooms).toBeNull();
    expect(input.usableAreaSquareMeters).toBeNull();
  });

  it("conserva el cero cuando se escribió", () => {
    expect(toPropertyInput(buildValues({ ageYears: "0" })).ageYears).toBe(0);
  });

  it("convierte los números escritos como texto", () => {
    const input = toPropertyInput(
      buildValues({ price: "250000", bathrooms: "2" }),
    );

    expect(input.price).toBe(250_000);
    expect(input.bathrooms).toBe(2);
  });

  it("recorta los espacios de los textos", () => {
    expect(toPropertyInput(buildValues({ title: "  Casa  " })).title).toBe(
      "Casa",
    );
  });

  it("no envía latitud ni longitud", () => {
    // Las coordenadas las deduce el servidor a partir de la dirección.
    const input = toPropertyInput(buildValues());

    expect(input).not.toHaveProperty("latitude");
    expect(input).not.toHaveProperty("longitude");
  });
});
