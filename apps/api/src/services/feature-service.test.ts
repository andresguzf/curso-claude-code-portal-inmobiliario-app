import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findAllFeatures: vi.fn(),
  findExistingFeatureSlugs: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/feature-repository", () => repository);

import { listFeatures } from "./feature-service";

afterEach(() => {
  for (const mock of Object.values(repository)) {
    mock.mockReset();
  }
});

describe("listFeatures", () => {
  it("envuelve las características en el contrato de la API", async () => {
    const features = [
      { id: "1", name: "Estacionamiento", slug: "estacionamiento" },
      { id: "2", name: "Piscina", slug: "piscina" },
    ];

    repository.findAllFeatures.mockResolvedValue(features);

    await expect(listFeatures()).resolves.toEqual({ data: features });
  });

  it("devuelve una lista vacía cuando no hay ninguna", async () => {
    repository.findAllFeatures.mockResolvedValue([]);

    await expect(listFeatures()).resolves.toEqual({ data: [] });
  });
});
