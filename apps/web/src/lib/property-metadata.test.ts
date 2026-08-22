import type { Metadata } from "next";
import { describe, expect, it } from "vitest";

import type { PropertyDetailDto } from "@portal/contracts";

import {
  buildPropertyDescription,
  buildPropertyMetadata,
  truncateAtWord,
} from "./property-metadata";

function buildProperty(
  overrides: Partial<PropertyDetailDto> = {},
): PropertyDetailDto {
  return {
    id: "prop-1",
    title: "Casa con jardín en Ñuñoa",
    description: "Casa luminosa con patio y quincho, cerca de Plaza Ñuñoa.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 250_000,
    currency: "USD",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    address: "Av. Irarrázaval 1234",
    bedrooms: 3,
    bathrooms: 2,
    parkingSpaces: 1,
    ageYears: 5,
    usableAreaSquareMeters: 120,
    totalAreaSquareMeters: 200,
    isFeatured: false,
    primaryImage: null,
    features: [],
    images: [],
    coordinates: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

const PORTADA = {
  id: "img-1",
  url: "https://res.cloudinary.com/x/image/upload/v1/portada.jpg",
  publicId: "propiedades-claude/portada",
  position: 0,
  isPrimary: true,
};

/**
 * Tipo de tarjeta de Twitter.
 *
 * El tipo de Next es una unión y `card` solo existe en una de sus ramas: hay
 * que estrecharlo antes de leerlo.
 */
function twitterCard(metadata: Metadata): string | undefined {
  const twitter = metadata.twitter;

  return twitter && "card" in twitter ? twitter.card : undefined;
}

const SECUNDARIA = {
  ...PORTADA,
  id: "img-2",
  url: "https://x/otra.jpg",
  position: 1,
  isPrimary: false,
};

describe("truncateAtWord", () => {
  it("deja el texto corto tal cual", () => {
    expect(truncateAtWord("Casa en Ñuñoa", 40)).toBe("Casa en Ñuñoa");
  });

  it("no parte una palabra por la mitad", () => {
    // «departamento lumin…» se lee peor que una frase que acaba antes.
    const recortado = truncateAtWord("departamento luminoso y amplio", 20);

    expect(recortado).toBe("departamento…");
  });

  it("no deja un signo de puntuación colgando antes de los puntos", () => {
    expect(truncateAtWord("Casa amplia, con patio", 14)).toBe("Casa amplia…");
  });

  it("respeta el largo máximo", () => {
    const largo = "palabra ".repeat(60);

    expect(truncateAtWord(largo, 160).length).toBeLessThanOrEqual(160);
  });
});

describe("buildPropertyDescription", () => {
  it("empieza por precio y ubicación, que es lo que decide entrar", () => {
    const description = buildPropertyDescription(buildProperty());

    expect(description).toMatch(/^US\$250\.000 · Av\. Irarrázaval 1234/);
  });

  it("señala que el arriendo es mensual", () => {
    const description = buildPropertyDescription(
      buildProperty({ operationType: "RENT", price: 1200 }),
    );

    expect(description).toMatch(/\/mes/);
  });

  it("colapsa los saltos de línea de la ficha", () => {
    const description = buildPropertyDescription(
      buildProperty({ description: "Primera línea.\n\n  Segunda línea." }),
    );

    expect(description).not.toMatch(/\n/);
    expect(description).toMatch(/Primera línea\. Segunda línea\./);
  });

  it("no supera lo que muestra un buscador", () => {
    const description = buildPropertyDescription(
      buildProperty({ description: "detalle ".repeat(80) }),
    );

    expect(description.length).toBeLessThanOrEqual(160);
  });
});

describe("buildPropertyMetadata", () => {
  it("usa el título de la propiedad", () => {
    expect(buildPropertyMetadata(buildProperty()).title).toBe(
      "Casa con jardín en Ñuñoa",
    );
  });

  it("declara la dirección canónica de la ficha", () => {
    expect(buildPropertyMetadata(buildProperty()).alternates?.canonical).toBe(
      "/properties/prop-1",
    );
  });

  it("nombra el sitio en el título de Open Graph", () => {
    // Ahí no hay plantilla que lo añada, y el título solo no dice dónde se
    // publicó.
    const metadata = buildPropertyMetadata(buildProperty());

    expect(metadata.openGraph?.title).toBe(
      "Casa con jardín en Ñuñoa | Portal Inmobiliario",
    );
  });

  it("comparte la portada, no cualquier imagen", () => {
    const metadata = buildPropertyMetadata(
      buildProperty({ images: [SECUNDARIA, PORTADA] }),
    );

    expect(metadata.openGraph?.images).toEqual([
      { url: PORTADA.url, alt: "Casa con jardín en Ñuñoa" },
    ]);
  });

  it("no inventa una imagen cuando la propiedad no tiene ninguna", () => {
    // La tarjeta compartida se ve mejor sin imagen que con una ajena.
    const metadata = buildPropertyMetadata(buildProperty({ images: [] }));

    expect(metadata.openGraph).not.toHaveProperty("images");
    expect(twitterCard(metadata)).toBe("summary");
  });

  it("pide tarjeta grande solo si hay imagen que enseñar", () => {
    const metadata = buildPropertyMetadata(
      buildProperty({ images: [PORTADA] }),
    );

    expect(twitterCard(metadata)).toBe("summary_large_image");
  });

  it("repite la misma descripción en las tres versiones", () => {
    const metadata = buildPropertyMetadata(buildProperty());

    expect(metadata.openGraph?.description).toBe(metadata.description);
    expect(metadata.twitter?.description).toBe(metadata.description);
  });
});
