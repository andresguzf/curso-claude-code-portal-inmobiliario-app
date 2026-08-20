import { afterEach, describe, expect, it, vi } from "vitest";

const { countOverview } = vi.hoisted(() => ({ countOverview: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/admin-repository", () => ({ countOverview }));

import { getAdminOverview } from "./admin-service";

afterEach(() => {
  countOverview.mockReset();
});

describe("getAdminOverview", () => {
  it("devuelve los seis indicadores de la especificación", async () => {
    const overview = {
      totalProperties: 12,
      publishedProperties: 10,
      propertiesForSale: 7,
      propertiesForRent: 5,
      users: 5,
      inquiries: 8,
    };

    countOverview.mockResolvedValue(overview);

    expect(await getAdminOverview()).toEqual(overview);
  });

  it("conserva los ceros en lugar de omitirlos", async () => {
    // Un portal recién instalado debe mostrar ceros, no huecos.
    countOverview.mockResolvedValue({
      totalProperties: 0,
      publishedProperties: 0,
      propertiesForSale: 0,
      propertiesForRent: 0,
      users: 0,
      inquiries: 0,
    });

    const overview = await getAdminOverview();

    expect(Object.values(overview)).toEqual([0, 0, 0, 0, 0, 0]);
  });
});
