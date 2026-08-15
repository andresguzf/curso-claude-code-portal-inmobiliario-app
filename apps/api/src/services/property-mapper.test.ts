import { describe, expect, it } from "vitest";

import {
  selectPrimaryImage,
  toPropertyDetail,
  toPropertySummary,
  type PropertyImageRecord,
  type PropertyRecord,
} from "./property-mapper";

/** `Decimal` de Prisma se comporta como un objeto con `toNumber()`. */
function decimal(value: number) {
  return { toNumber: () => value };
}

function buildImage(
  overrides: Partial<PropertyImageRecord> & { id: string },
): PropertyImageRecord {
  return {
    url: `https://example.test/${overrides.id}.jpg`,
    publicId: `seed/${overrides.id}`,
    position: 0,
    isPrimary: false,
    ...overrides,
  };
}

function buildProperty(overrides: Partial<PropertyRecord> = {}): PropertyRecord {
  return {
    id: "property-1",
    title: "Casa en Las Condes",
    description: "Casa amplia con jardín.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: decimal(890000),
    currency: "USD",
    usableAreaSquareMeters: decimal(180),
    totalAreaSquareMeters: decimal(420),
    bedrooms: 4,
    bathrooms: 3,
    parkingSpaces: 2,
    ageYears: 12,
    address: "Avenida Siempre Viva 742",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    isFeatured: true,
    createdAt: new Date("2026-01-15T10:30:00.000Z"),
    updatedAt: new Date("2026-02-01T08:00:00.000Z"),
    images: [],
    ...overrides,
  };
}

describe("selectPrimaryImage", () => {
  it("devuelve null cuando la propiedad no tiene imágenes", () => {
    expect(selectPrimaryImage([])).toBeNull();
  });

  it("prefiere la imagen marcada como principal", () => {
    const images = [
      buildImage({ id: "a", position: 0 }),
      buildImage({ id: "b", position: 1, isPrimary: true }),
    ];

    expect(selectPrimaryImage(images)?.id).toBe("b");
  });

  it("usa la de menor posición cuando ninguna es principal", () => {
    const images = [
      buildImage({ id: "a", position: 2 }),
      buildImage({ id: "b", position: 1 }),
    ];

    expect(selectPrimaryImage(images)?.id).toBe("b");
  });
});

describe("toPropertySummary", () => {
  it("convierte Decimal a número y Date a ISO", () => {
    const summary = toPropertySummary(buildProperty());

    expect(summary.price).toBe(890000);
    expect(summary.usableAreaSquareMeters).toBe(180);
    expect(summary.createdAt).toBe("2026-01-15T10:30:00.000Z");
  });

  it("acepta números planos además de Decimal", () => {
    const summary = toPropertySummary(
      buildProperty({ price: 1200, usableAreaSquareMeters: 62 }),
    );

    expect(summary.price).toBe(1200);
    expect(summary.usableAreaSquareMeters).toBe(62);
  });

  it("conserva los campos opcionales nulos de un terreno", () => {
    const summary = toPropertySummary(
      buildProperty({
        propertyType: "LAND",
        bedrooms: null,
        bathrooms: null,
        usableAreaSquareMeters: null,
      }),
    );

    expect(summary.bedrooms).toBeNull();
    expect(summary.bathrooms).toBeNull();
    expect(summary.usableAreaSquareMeters).toBeNull();
  });

  it("no expone la descripción ni la dirección en el resumen", () => {
    const summary = toPropertySummary(buildProperty());

    expect(summary).not.toHaveProperty("description");
    expect(summary).not.toHaveProperty("address");
  });

  it("incluye los datos que necesita una tarjeta del catálogo", () => {
    const summary = toPropertySummary(
      buildProperty({ images: [buildImage({ id: "a", isPrimary: true })] }),
    );

    expect(summary).toMatchObject({
      id: "property-1",
      title: "Casa en Las Condes",
      operationType: "SALE",
      propertyType: "HOUSE",
      currency: "USD",
      commune: "Las Condes",
    });
    expect(summary.primaryImage?.id).toBe("a");
  });
});

describe("toPropertyDetail", () => {
  it("ordena la galería por posición", () => {
    const detail = toPropertyDetail(
      buildProperty({
        images: [
          buildImage({ id: "c", position: 2 }),
          buildImage({ id: "a", position: 0, isPrimary: true }),
          buildImage({ id: "b", position: 1 }),
        ],
      }),
    );

    expect(detail.images.map((image) => image.id)).toEqual(["a", "b", "c"]);
  });

  it("ordena las características alfabéticamente", () => {
    const detail = toPropertyDetail(
      buildProperty({
        features: [
          { id: "3", name: "Quincho", slug: "quincho" },
          { id: "1", name: "Ascensor", slug: "ascensor" },
          { id: "2", name: "Jardín", slug: "jardin" },
        ],
      }),
    );

    expect(detail.features.map((feature) => feature.name)).toEqual([
      "Ascensor",
      "Jardín",
      "Quincho",
    ]);
  });

  it("devuelve una lista vacía cuando no hay características", () => {
    expect(toPropertyDetail(buildProperty()).features).toEqual([]);
  });

  it("expone los campos del detalle exigidos por la especificación", () => {
    const detail = toPropertyDetail(buildProperty());

    expect(detail).toMatchObject({
      description: "Casa amplia con jardín.",
      address: "Avenida Siempre Viva 742",
      totalAreaSquareMeters: 420,
      parkingSpaces: 2,
      ageYears: 12,
    });
  });

  it("produce un objeto serializable a JSON sin pérdidas", () => {
    const detail = toPropertyDetail(
      buildProperty({ images: [buildImage({ id: "a", isPrimary: true })] }),
    );

    expect(JSON.parse(JSON.stringify(detail))).toEqual(detail);
  });
});
