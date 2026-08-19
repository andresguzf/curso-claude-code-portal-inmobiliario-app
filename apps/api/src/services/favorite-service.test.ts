import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findFavoriteProperties: vi.fn(),
  findFavoritePropertyIds: vi.fn(),
  findPublishedPropertyId: vi.fn(),
  createFavorite: vi.fn(),
  deleteFavorite: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/favorite-repository", () => repository);

import { addFavorite, listFavorites, removeFavorite } from "./favorite-service";

function buildProperty(id: string) {
  return {
    id,
    title: "Casa",
    description: "",
    operationType: "SALE" as const,
    propertyType: "HOUSE" as const,
    price: 100,
    currency: "USD" as const,
    usableAreaSquareMeters: null,
    totalAreaSquareMeters: null,
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageYears: null,
    address: "Calle 1",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    isFeatured: false,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    images: [],
  };
}

afterEach(() => {
  for (const mock of Object.values(repository)) {
    mock.mockReset();
  }
});

describe("listFavorites", () => {
  it("devuelve las propiedades guardadas con su total", async () => {
    repository.findFavoriteProperties.mockResolvedValue([
      buildProperty("p2"),
      buildProperty("p1"),
    ]);

    const list = await listFavorites("u1");

    expect(list.total).toBe(2);
    expect(list.data.map((property) => property.id)).toEqual(["p2", "p1"]);
  });

  it("no expone la descripción ni la dirección en el resumen", async () => {
    repository.findFavoriteProperties.mockResolvedValue([buildProperty("p1")]);

    const [property] = (await listFavorites("u1")).data;

    expect(property).not.toHaveProperty("description");
    expect(property).not.toHaveProperty("address");
  });

  it("pide solo los favoritos de quien consulta", async () => {
    repository.findFavoriteProperties.mockResolvedValue([]);

    await listFavorites("u1");

    expect(repository.findFavoriteProperties).toHaveBeenCalledWith("u1");
  });
});

describe("addFavorite", () => {
  it("guarda una propiedad publicada", async () => {
    repository.findPublishedPropertyId.mockResolvedValue({ id: "p1" });

    expect(await addFavorite("u1", "p1")).toEqual({ status: "ok" });
    expect(repository.createFavorite).toHaveBeenCalledWith("u1", "p1");
  });

  it("rechaza una propiedad despublicada o inexistente", async () => {
    repository.findPublishedPropertyId.mockResolvedValue(null);

    expect(await addFavorite("u1", "borrador")).toEqual({
      status: "property-not-found",
    });
    expect(repository.createFavorite).not.toHaveBeenCalled();
  });

  it("es idempotente: repetirla no vuelve a fallar", async () => {
    repository.findPublishedPropertyId.mockResolvedValue({ id: "p1" });

    expect(await addFavorite("u1", "p1")).toEqual({ status: "ok" });
    expect(await addFavorite("u1", "p1")).toEqual({ status: "ok" });
  });
});

describe("removeFavorite", () => {
  it("quita la propiedad de la lista de quien la pide", async () => {
    expect(await removeFavorite("u1", "p1")).toEqual({ status: "ok" });
    expect(repository.deleteFavorite).toHaveBeenCalledWith("u1", "p1");
  });

  it("no falla si la propiedad no estaba guardada", async () => {
    // El resultado deseado —que no esté— ya se cumple.
    expect(await removeFavorite("u1", "nunca-guardada")).toEqual({
      status: "ok",
    });
  });

  it("no comprueba la propiedad: solo borra lo que es de esta persona", async () => {
    await removeFavorite("u1", "p1");

    expect(repository.findPublishedPropertyId).not.toHaveBeenCalled();
  });
});
