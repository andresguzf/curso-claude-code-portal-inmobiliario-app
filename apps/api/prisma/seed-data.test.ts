import { describe, expect, it } from "vitest";

import { AUTH_LIMITS } from "@portal/contracts";

import {
  SEED_FEATURES,
  SEED_PROPERTIES,
  SEED_USERS,
  buildSeedImages,
  type SeedProperty,
} from "./seed-data";

const featureSlugs = new Set(SEED_FEATURES.map((feature) => feature.slug));

describe("características del seed", () => {
  it("no repite slugs ni nombres", () => {
    expect(featureSlugs.size).toBe(SEED_FEATURES.length);

    const names = new Set(SEED_FEATURES.map((feature) => feature.name));
    expect(names.size).toBe(SEED_FEATURES.length);
  });

  it("cubre las características listadas en la especificación", () => {
    for (const slug of [
      "piscina",
      "gimnasio",
      "quincho",
      "lavanderia",
      "jardin",
      "terraza",
      "bodega",
      "ascensor",
      "conserjeria",
      "seguridad",
      "calefaccion",
      "aire-acondicionado",
      "pet-friendly",
    ]) {
      expect(featureSlugs).toContain(slug);
    }
  });
});

describe("propiedades del seed", () => {
  it("usa identificadores únicos", () => {
    const ids = new Set(SEED_PROPERTIES.map((property) => property.id));
    expect(ids.size).toBe(SEED_PROPERTIES.length);
  });

  it("solo referencia características existentes", () => {
    for (const property of SEED_PROPERTIES) {
      for (const slug of property.featureSlugs) {
        expect(featureSlugs, `propiedad ${property.id}`).toContain(slug);
      }
    }
  });

  it("incluye propiedades de venta y de arriendo", () => {
    const operations = SEED_PROPERTIES.map(
      (property) => property.operationType,
    );

    expect(operations).toContain("SALE");
    expect(operations).toContain("RENT");
  });

  it("incluye casas, departamentos, terrenos y oficinas", () => {
    const types = new Set(
      SEED_PROPERTIES.map((property) => property.propertyType),
    );

    expect(types).toContain("HOUSE");
    expect(types).toContain("APARTMENT");
    expect(types).toContain("LAND");
    expect(types).toContain("OFFICE");
  });

  it("reparte las propiedades entre varias comunas y regiones", () => {
    const communes = new Set(
      SEED_PROPERTIES.map((property) => property.commune),
    );
    const regions = new Set(SEED_PROPERTIES.map((property) => property.region));

    expect(communes.size).toBeGreaterThanOrEqual(5);
    expect(regions.size).toBeGreaterThanOrEqual(2);
  });

  it("varía los precios dentro de cada tipo de operación", () => {
    for (const operationType of ["SALE", "RENT"] as const) {
      const prices = SEED_PROPERTIES.filter(
        (property) => property.operationType === operationType,
      ).map((property) => Number(property.price));

      expect(prices.length).toBeGreaterThanOrEqual(3);
      expect(new Set(prices).size).toBe(prices.length);
      expect(Math.min(...prices)).toBeGreaterThan(0);
    }
  });

  it("mantiene propiedades sin publicar para validar el filtrado público", () => {
    const unpublished = SEED_PROPERTIES.filter(
      (property) => !property.isPublished,
    );

    expect(unpublished.length).toBeGreaterThan(0);
  });

  it("solo destaca propiedades publicadas", () => {
    for (const property of SEED_PROPERTIES) {
      if (property.isFeatured) {
        expect(property.isPublished, `propiedad ${property.id}`).toBe(true);
      }
    }
  });

  it("omite dormitorios y baños en los terrenos", () => {
    const lands = SEED_PROPERTIES.filter(
      (property) => property.propertyType === "LAND",
    );

    expect(lands.length).toBeGreaterThan(0);

    for (const land of lands) {
      expect(land.bedrooms).toBeNull();
      expect(land.bathrooms).toBeNull();
      expect(land.totalAreaSquareMeters).not.toBeNull();
    }
  });

  it("no declara superficie útil mayor que la superficie total", () => {
    for (const property of SEED_PROPERTIES) {
      if (
        property.usableAreaSquareMeters === null ||
        property.totalAreaSquareMeters === null
      ) {
        continue;
      }

      expect(
        Number(property.usableAreaSquareMeters),
        `propiedad ${property.id}`,
      ).toBeLessThanOrEqual(Number(property.totalAreaSquareMeters));
    }
  });
});

describe("buildSeedImages", () => {
  const property = SEED_PROPERTIES[0] as SeedProperty;

  it("genera exactamente una imagen principal en la primera posición", () => {
    const images = buildSeedImages(property);

    expect(images).toHaveLength(property.imageCount);
    expect(images.filter((image) => image.isPrimary)).toHaveLength(1);
    expect(images[0]?.isPrimary).toBe(true);
    expect(images.map((image) => image.position)).toEqual(
      images.map((_, index) => index),
    );
  });

  it("genera publicId únicos en todo el catálogo", () => {
    const publicIds = SEED_PROPERTIES.flatMap((seedProperty) =>
      buildSeedImages(seedProperty).map((image) => image.publicId),
    );

    expect(new Set(publicIds).size).toBe(publicIds.length);
  });

  it("asigna al menos una imagen a cada propiedad", () => {
    for (const seedProperty of SEED_PROPERTIES) {
      expect(
        buildSeedImages(seedProperty).length,
        `propiedad ${seedProperty.id}`,
      ).toBeGreaterThan(0);
    }
  });
});

describe("SEED_USERS", () => {
  it("no repite correos", () => {
    const emails = SEED_USERS.map((user) => user.email);

    expect(new Set(emails).size).toBe(emails.length);
  });

  it("usa contraseñas que el backend aceptaría", () => {
    // Sin esta comprobación, una cuenta del seed podría quedar imposible de
    // usar: el seed guarda el hash sin validar, y el fallo solo aparecería
    // al intentar entrar.
    for (const user of SEED_USERS) {
      expect(user.password.length).toBeGreaterThanOrEqual(
        AUTH_LIMITS.minPasswordLength,
      );
    }
  });

  it("incluye una cuenta de administración", () => {
    expect(SEED_USERS.some((user) => user.role === "ADMIN")).toBe(true);
  });

  it("incluye una cuenta desactivada, para probar que no puede entrar", () => {
    expect(SEED_USERS.some((user) => !user.isActive)).toBe(true);
  });

  it("guarda los correos en minúsculas, como los normaliza el repositorio", () => {
    for (const user of SEED_USERS) {
      expect(user.email).toBe(user.email.toLowerCase());
    }
  });
});
