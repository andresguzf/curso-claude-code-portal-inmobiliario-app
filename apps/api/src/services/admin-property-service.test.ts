import { afterEach, describe, expect, it, vi } from "vitest";

const propertyRepository = vi.hoisted(() => ({
  createProperty: vi.fn(),
  markPropertyAsDeleted: vi.fn(),
  findAdminProperties: vi.fn(),
  findAdminPropertyById: vi.fn(),
  updateProperty: vi.fn(),
}));

const featureRepository = vi.hoisted(() => ({
  findAllFeatures: vi.fn(),
  findExistingFeatureSlugs: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/admin-property-repository", () => propertyRepository);
vi.mock("@/repositories/feature-repository", () => featureRepository);

import {
  createAdminProperty,
  updateAdminProperty,
} from "./admin-property-service";

/** Propiedad válida mínima, sobre la que cada prueba cambia lo suyo. */
function buildInput(overrides: Record<string, unknown> = {}) {
  return {
    title: "Casa en Ñuñoa",
    description: "Una casa.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 250_000,
    address: "Av. Siempre Viva 742",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    ...overrides,
  };
}

function buildRow() {
  return {
    id: "prop-1",
    title: "Casa en Ñuñoa",
    description: "Una casa.",
    operationType: "SALE" as const,
    propertyType: "HOUSE" as const,
    price: 250_000,
    currency: "USD" as const,
    usableAreaSquareMeters: null,
    totalAreaSquareMeters: null,
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageYears: null,
    address: "Av. Siempre Viva 742",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: false,
    isFeatured: false,
    features: [],
    images: [],
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

afterEach(() => {
  for (const mock of [
    ...Object.values(propertyRepository),
    ...Object.values(featureRepository),
  ]) {
    mock.mockReset();
  }
});

describe("createAdminProperty", () => {
  it("rechaza una característica que no existe, sin escribir nada", async () => {
    featureRepository.findExistingFeatureSlugs.mockResolvedValue(["piscina"]);

    const outcome = await createAdminProperty(
      buildInput({ featureSlugs: ["piscina", "helipuerto"] }),
    );

    expect(outcome).toEqual({
      status: "invalid",
      message: "Estas características no existen: helipuerto.",
    });
    expect(propertyRepository.createProperty).not.toHaveBeenCalled();
  });

  it("no consulta las características cuando no se envía ninguna", async () => {
    propertyRepository.createProperty.mockResolvedValue(buildRow());

    const outcome = await createAdminProperty(buildInput());

    expect(outcome.status).toBe("ok");
    expect(featureRepository.findExistingFeatureSlugs).not.toHaveBeenCalled();
  });

  it("crea la propiedad cuando todas las características existen", async () => {
    featureRepository.findExistingFeatureSlugs.mockResolvedValue(["piscina"]);
    propertyRepository.createProperty.mockResolvedValue(buildRow());

    const outcome = await createAdminProperty(
      buildInput({ featureSlugs: ["piscina"] }),
    );

    expect(outcome.status).toBe("ok");
    expect(propertyRepository.createProperty).toHaveBeenCalledWith(
      expect.objectContaining({ featureSlugs: ["piscina"] }),
    );
  });
});

describe("updateAdminProperty", () => {
  it("rechaza una característica inexistente antes de buscar la propiedad", async () => {
    featureRepository.findExistingFeatureSlugs.mockResolvedValue([]);

    const outcome = await updateAdminProperty(
      "prop-1",
      buildInput({ featureSlugs: ["helipuerto"] }),
    );

    expect(outcome.status).toBe("invalid");
    expect(propertyRepository.updateProperty).not.toHaveBeenCalled();
  });

  it("responde «no encontrada» sobre una propiedad eliminada", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue(null);

    const outcome = await updateAdminProperty("prop-borrada", buildInput());

    expect(outcome).toEqual({ status: "not-found" });
    expect(propertyRepository.updateProperty).not.toHaveBeenCalled();
  });
});
