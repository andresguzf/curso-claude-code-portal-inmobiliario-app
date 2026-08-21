import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findAllFeatures: vi.fn(),
  findFeatureById: vi.fn(),
  findFeatureByNameOrSlug: vi.fn(),
  findExistingFeatureSlugs: vi.fn(),
  createFeature: vi.fn(),
  renameFeature: vi.fn(),
  deleteFeature: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/feature-repository", () => repository);

import {
  addFeature,
  changeFeatureName,
  listFeatures,
  removeFeature,
} from "./feature-service";

function buildRecord(
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "f1",
    name: "Piscina",
    slug: "piscina",
    _count: { properties: 3 },
    ...overrides,
  };
}

afterEach(() => {
  for (const mock of Object.values(repository)) {
    mock.mockReset();
  }
});

describe("listFeatures", () => {
  it("acompaña cada característica de cuántas propiedades la usan", async () => {
    // Es lo que permite advertir a cuántas fichas afecta eliminarla.
    repository.findAllFeatures.mockResolvedValue([buildRecord()]);

    await expect(listFeatures()).resolves.toEqual({
      data: [{ id: "f1", name: "Piscina", slug: "piscina", propertyCount: 3 }],
    });
  });

  it("devuelve una lista vacía cuando no hay ninguna", async () => {
    repository.findAllFeatures.mockResolvedValue([]);

    await expect(listFeatures()).resolves.toEqual({ data: [] });
  });
});

describe("addFeature", () => {
  it("da de alta la característica con el identificador derivado", async () => {
    repository.findFeatureByNameOrSlug.mockResolvedValue(null);
    repository.createFeature.mockResolvedValue(
      buildRecord({ name: "Piscina temperada", slug: "piscina-temperada" }),
    );

    const outcome = await addFeature({ name: "Piscina temperada" });

    expect(outcome.status).toBe("ok");
    expect(repository.createFeature).toHaveBeenCalledWith({
      name: "Piscina temperada",
      slug: "piscina-temperada",
    });
  });

  it("rechaza una repetida antes de escribir", async () => {
    // Dejar reventar la unicidad de PostgreSQL daría un 500 sin explicación.
    repository.findFeatureByNameOrSlug.mockResolvedValue(buildRecord());

    const outcome = await addFeature({ name: "piscina" });

    expect(outcome).toEqual({
      status: "duplicate",
      message: "«Piscina» ya existe.",
    });
    expect(repository.createFeature).not.toHaveBeenCalled();
  });

  it("no consulta la base si el nombre no vale", async () => {
    const outcome = await addFeature({ name: "  " });

    expect(outcome.status).toBe("invalid");
    expect(repository.findFeatureByNameOrSlug).not.toHaveBeenCalled();
  });
});

describe("changeFeatureName", () => {
  it("cambia el nombre y deja el identificador quieto", async () => {
    // El `slug` es con lo que se conectan las propiedades: moverlo por una
    // errata rompería esas referencias.
    repository.findFeatureById.mockResolvedValue(buildRecord());
    repository.findFeatureByNameOrSlug.mockResolvedValue(null);
    repository.renameFeature.mockResolvedValue(
      buildRecord({ name: "Piscina climatizada" }),
    );

    const outcome = await changeFeatureName("f1", {
      name: "Piscina climatizada",
    });

    expect(outcome.status).toBe("ok");
    expect(repository.renameFeature).toHaveBeenCalledWith(
      "f1",
      "Piscina climatizada",
    );
  });

  it("deja corregir mayúsculas sobre sí misma", async () => {
    // Chocar consigo misma no es un choque.
    repository.findFeatureById.mockResolvedValue(buildRecord());
    repository.findFeatureByNameOrSlug.mockResolvedValue(buildRecord());
    repository.renameFeature.mockResolvedValue(
      buildRecord({ name: "piscina" }),
    );

    expect((await changeFeatureName("f1", { name: "piscina" })).status).toBe(
      "ok",
    );
  });

  it("rechaza el nombre de otra característica", async () => {
    repository.findFeatureById.mockResolvedValue(buildRecord());
    repository.findFeatureByNameOrSlug.mockResolvedValue(
      buildRecord({ id: "f2", name: "Quincho" }),
    );

    expect(await changeFeatureName("f1", { name: "Quincho" })).toEqual({
      status: "duplicate",
      message: "«Quincho» ya existe.",
    });
    expect(repository.renameFeature).not.toHaveBeenCalled();
  });

  it("responde «no encontrada» si no existe", async () => {
    repository.findFeatureById.mockResolvedValue(null);

    expect(await changeFeatureName("fantasma", { name: "Piscina" })).toEqual({
      status: "not-found",
    });
  });
});

describe("removeFeature", () => {
  it("la elimina", async () => {
    repository.findFeatureById.mockResolvedValue(buildRecord());

    expect(await removeFeature("f1")).toEqual({ status: "deleted" });
    expect(repository.deleteFeature).toHaveBeenCalledWith("f1");
  });

  it("responde «no encontrada» si no existe", async () => {
    repository.findFeatureById.mockResolvedValue(null);

    expect(await removeFeature("fantasma")).toEqual({ status: "not-found" });
    expect(repository.deleteFeature).not.toHaveBeenCalled();
  });
});
