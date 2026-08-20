import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  PropertyFilterOptionsDto,
  PropertyListDto,
} from "@portal/contracts";

import { buildPropertySummary } from "@/test-support/property-fixtures";

import PropertiesPage, {
  CatalogLoading,
  CatalogResults,
  countActiveFilters,
  hasActiveFilters,
  readQuery,
} from "./page";

const { fetchPublicProperties, fetchFilterOptions } = vi.hoisted(() => ({
  fetchPublicProperties: vi.fn(),
  fetchFilterOptions: vi.fn(),
}));

vi.mock("@/lib/api-client", async () => {
  const actual =
    await vi.importActual<typeof import("@/lib/api-client")>(
      "@/lib/api-client",
    );

  return { ...actual, fetchPublicProperties, fetchFilterOptions };
});

// Los componentes de filtros y orden son de cliente: fuera de Next no hay router.
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

// El catálogo pide los favoritos junto con las propiedades; sin sesión
// no hay ninguno y las tarjetas no ofrecen el botón.
vi.mock("@/lib/favorites", () => ({
  getFavoritePropertyIds: async () => undefined,
}));

const OPTIONS: PropertyFilterOptionsDto = {
  communes: ["Las Condes", "Providencia", "Ñuñoa"],
  cities: ["Santiago"],
  regions: ["Región Metropolitana"],
};

afterEach(() => {
  fetchPublicProperties.mockReset();
  fetchFilterOptions.mockReset();
  vi.restoreAllMocks();
});

/** Next entrega `searchParams` como promesa. */
async function renderPage(
  searchParams: Record<string, string | string[]> = {},
) {
  fetchFilterOptions.mockResolvedValue(OPTIONS);
  fetchPublicProperties.mockResolvedValue({ data: [], total: 0 });

  return render(
    await PropertiesPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

async function renderResults(
  list: PropertyListDto,
  query: Parameters<typeof CatalogResults>[0]["query"] = {},
) {
  fetchPublicProperties.mockResolvedValue(list);

  return render(await CatalogResults({ query }));
}

function checkbox(legend: string, label: string) {
  return within(
    screen.getByRole("group", { name: legend }),
  ).getByRole<HTMLInputElement>("checkbox", { name: label });
}

describe("PropertiesPage — estructura", () => {
  it("titula la página y muestra el panel de filtros", async () => {
    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Propiedades" }),
    ).toBeVisible();
    expect(
      screen.getByRole("search", { name: "Búsqueda y filtros" }),
    ).toBeInTheDocument();
  });

  it("puebla los filtros de ubicación desde la API", async () => {
    await renderPage();

    expect(fetchFilterOptions).toHaveBeenCalledOnce();
    expect(checkbox("Comuna", "Providencia")).toBeInTheDocument();
  });

  it("refleja los filtros de la URL en el panel", async () => {
    await renderPage({
      operation: "SALE",
      commune: ["Las Condes", "Providencia"],
    });

    expect(checkbox("Operación", "Venta")).toBeChecked();
    expect(checkbox("Comuna", "Las Condes")).toBeChecked();
    expect(checkbox("Comuna", "Providencia")).toBeChecked();
    expect(checkbox("Comuna", "Ñuñoa")).not.toBeChecked();
  });

  it("mantiene los filtros aunque fallen sus opciones de ubicación", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchFilterOptions.mockRejectedValue(new Error("sin filtros"));
    fetchPublicProperties.mockResolvedValue({ data: [], total: 0 });

    render(
      await PropertiesPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByRole("search", { name: "Búsqueda y filtros" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin comunas disponibles.")).toBeVisible();
  });
});

describe("CatalogLoading", () => {
  it("anuncia la carga y muestra marcadores en lugar de resultados", () => {
    const { container } = render(<CatalogLoading />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Buscando propiedades…",
    );
    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("oculta los marcadores a las tecnologías de asistencia", () => {
    const { container } = render(<CatalogLoading />);

    const skeleton = container.querySelector('[aria-hidden="true"]');

    expect(skeleton).toBeInTheDocument();
    expect(skeleton?.children.length).toBeGreaterThan(0);
  });
});

describe("CatalogResults — resultados", () => {
  it("lista las propiedades publicadas", async () => {
    await renderResults({
      data: [
        buildPropertySummary({ id: "a", title: "Casa en Las Condes" }),
        buildPropertySummary({ id: "b", title: "Departamento en Ñuñoa" }),
      ],
      total: 2,
    });

    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(2);
  });

  it("consume la API REST en lugar de la base de datos", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 1 });

    expect(fetchPublicProperties).toHaveBeenCalledOnce();
  });

  it("informa cuántas propiedades hay publicadas", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 10 });

    expect(screen.getByText("10 propiedades publicadas.")).toBeVisible();
  });

  it("concuerda el singular con una sola propiedad", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 1 });

    expect(screen.getByText("1 propiedad publicada.")).toBeVisible();
  });

  it("cambia el texto cuando hay filtros activos", async () => {
    await renderResults(
      { data: [buildPropertySummary()], total: 3 },
      { operations: ["SALE"] },
    );

    expect(screen.getByText("3 propiedades coinciden.")).toBeVisible();
  });

  it("ofrece el selector de ordenamiento junto a los resultados", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 1 });

    expect(screen.getByLabelText("Ordenar por")).toBeInTheDocument();
  });
});

describe("CatalogResults — estados sin resultados", () => {
  it("avisa cuando el catálogo está vacío, sin culpar a los filtros", async () => {
    await renderResults({ data: [], total: 0 });

    expect(
      screen.getByText("Todavía no hay propiedades publicadas"),
    ).toBeVisible();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Limpiar filtros" }),
    ).not.toBeInTheDocument();
  });

  it("distingue «sin coincidencias» y ofrece limpiar los filtros", async () => {
    await renderResults({ data: [], total: 0 }, { operations: ["SALE"] });

    expect(screen.getByText("Ninguna propiedad coincide")).toBeVisible();
    expect(
      screen.queryByText("Todavía no hay propiedades publicadas"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }),
    ).toHaveAttribute("href", "/properties");
  });

  it("distingue el fallo de la API del catálogo vacío", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchPublicProperties.mockRejectedValue(new Error("backend caído"));

    render(await CatalogResults({ query: {} }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("No pudimos cargar el catálogo")).toBeVisible();
    expect(
      screen.queryByText("Todavía no hay propiedades publicadas"),
    ).not.toBeInTheDocument();
  });

  it("anuncia el error de inmediato y ofrece reintentar", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchPublicProperties.mockRejectedValue(new Error("backend caído"));

    render(await CatalogResults({ query: {} }));

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
      "href",
      "/properties",
    );
  });

  it("registra el fallo en el servidor", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchPublicProperties.mockRejectedValue(new Error("backend caído"));

    render(await CatalogResults({ query: {} }));

    expect(consoleError).toHaveBeenCalled();
  });
});

describe("readQuery", () => {
  it("devuelve todo indefinido sin parámetros", () => {
    expect(readQuery({})).toEqual({
      search: undefined,
      operations: undefined,
      types: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      bedrooms: undefined,
      bathrooms: undefined,
      minUsableArea: undefined,
      communes: undefined,
      city: undefined,
      region: undefined,
      sort: undefined,
    });
  });

  it("traduce el ejemplo de la especificación", () => {
    expect(
      readQuery({ operation: "SALE", commune: "las-condes", bedrooms: "3" }),
    ).toMatchObject({
      operations: ["SALE"],
      communes: ["las-condes"],
      bedrooms: 3,
    });
  });

  it("acepta varias comunas y varios tipos", () => {
    expect(
      readQuery({
        commune: ["Las Condes", "Providencia"],
        type: ["HOUSE", "APARTMENT"],
      }),
    ).toMatchObject({
      communes: ["Las Condes", "Providencia"],
      types: ["HOUSE", "APARTMENT"],
    });
  });

  it("descarta duplicados en un filtro múltiple", () => {
    expect(readQuery({ commune: ["Ñuñoa", "Ñuñoa"] })).toMatchObject({
      communes: ["Ñuñoa"],
    });
  });

  it("descarta valores inválidos en lugar de reenviarlos", () => {
    expect(
      readQuery({
        operation: "REGALO",
        type: "CASTILLO",
        minPrice: "barato",
        bedrooms: "-3",
        sort: "al-azar",
      }),
    ).toMatchObject({
      operations: undefined,
      types: undefined,
      minPrice: undefined,
      bedrooms: undefined,
      sort: undefined,
    });
  });

  it("conserva los valores válidos de una lista con basura", () => {
    expect(readQuery({ type: ["HOUSE", "CASTILLO"] })).toMatchObject({
      types: ["HOUSE"],
    });
  });

  it("toma el primer valor en los parámetros de selección única", () => {
    expect(readQuery({ city: ["Santiago", "Temuco"] })).toMatchObject({
      city: "Santiago",
    });
  });

  it("acepta los cinco criterios de ordenamiento", () => {
    for (const sort of [
      "newest",
      "price-asc",
      "price-desc",
      "area-asc",
      "area-desc",
    ]) {
      expect(readQuery({ sort }).sort).toBe(sort);
    }
  });
});

describe("countActiveFilters", () => {
  it("no cuenta nada sin filtros", () => {
    expect(countActiveFilters({})).toBe(0);
    expect(
      countActiveFilters({ search: undefined, operations: undefined }),
    ).toBe(0);
  });

  it("no cuenta las listas vacías", () => {
    expect(countActiveFilters({ operations: [], communes: [] })).toBe(0);
  });

  it("no cuenta el ordenamiento, que no reduce resultados", () => {
    expect(countActiveFilters({ sort: "price-asc" })).toBe(0);
    expect(countActiveFilters({ sort: "price-asc", bedrooms: 3 })).toBe(1);
  });

  it("cuenta cada filtro una vez, aunque tenga varios valores", () => {
    expect(
      countActiveFilters({ communes: ["Las Condes", "Providencia"] }),
    ).toBe(1);
    expect(
      countActiveFilters({
        operations: ["SALE"],
        communes: ["Ñuñoa"],
        bedrooms: 3,
      }),
    ).toBe(3);
  });
});

describe("hasActiveFilters", () => {
  it("es falso sin filtros", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ sort: "price-asc" })).toBe(false);
  });

  it("es verdadero con cualquier filtro presente", () => {
    expect(hasActiveFilters({ search: "parque" })).toBe(true);
    expect(hasActiveFilters({ operations: ["SALE"] })).toBe(true);
    expect(hasActiveFilters({ bedrooms: 3 })).toBe(true);
    expect(hasActiveFilters({ communes: ["Ñuñoa"] })).toBe(true);
  });
});
