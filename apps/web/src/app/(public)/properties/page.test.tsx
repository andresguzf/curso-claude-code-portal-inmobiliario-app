import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  PROPERTIES_PER_PAGE,
  type PropertyFilterOptionsDto,
  type PropertyListDto,
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
  fetchPublicProperties.mockResolvedValue({
    data: [],
    total: 0,
    page: 1,
    pageSize: PROPERTIES_PER_PAGE,
  });

  return render(
    await PropertiesPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(searchParams),
    }),
  );
}

/**
 * La paginación se rellena por omisión: cada prueba declara solo lo que le
 * importa, y así añadir un campo a la respuesta no obliga a tocarlas todas.
 */
async function renderResults(
  list: Pick<PropertyListDto, "data" | "total"> & Partial<PropertyListDto>,
  query: Parameters<typeof CatalogResults>[0]["query"] = {},
) {
  fetchPublicProperties.mockResolvedValue({
    page: 1,
    pageSize: PROPERTIES_PER_PAGE,
    ...list,
  });

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
    fetchPublicProperties.mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      pageSize: PROPERTIES_PER_PAGE,
    });

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

describe("CatalogResults — paginación", () => {
  it("no pinta el control cuando todo cabe en una página", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 5 });

    expect(
      screen.queryByRole("navigation", { name: "Paginación del catálogo" }),
    ).toBeNull();
  });

  it("pinta el control cuando hay más de una página", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 20 });

    expect(
      screen.getByRole("navigation", { name: "Paginación del catálogo" }),
    ).toBeInTheDocument();
  });

  it("propaga la búsqueda y los filtros a las demás páginas", async () => {
    await renderResults(
      { data: [buildPropertySummary()], total: 30 },
      { search: "parque", operations: ["SALE"], sort: "price-asc" },
    );

    const siguiente = screen.getByRole("link", { name: /Página siguiente/ });
    const destino = new URL(
      siguiente.getAttribute("href") ?? "",
      "http://localhost",
    );

    // Si al cambiar de página se perdieran, la segunda mostraría un listado
    // distinto de la primera.
    expect(destino.searchParams.get("search")).toBe("parque");
    expect(destino.searchParams.get("operation")).toBe("SALE");
    expect(destino.searchParams.get("sort")).toBe("price-asc");
    expect(destino.searchParams.get("page")).toBe("2");
  });

  it("conserva varias comunas al cambiar de página", async () => {
    await renderResults(
      { data: [buildPropertySummary()], total: 30 },
      { communes: ["Ñuñoa", "Las Condes"] },
    );

    const destino = new URL(
      screen
        .getByRole("link", { name: /Última página/ })
        .getAttribute("href") ?? "",
      "http://localhost",
    );

    expect(destino.searchParams.getAll("commune")).toEqual([
      "Ñuñoa",
      "Las Condes",
    ]);
  });

  it("calcula la última página a partir del total", async () => {
    await renderResults({ data: [buildPropertySummary()], total: 28, page: 1 });

    // 28 entre 9 son cuatro páginas: tres llenas y una de una.
    expect(screen.getByText("Página 1 de 4")).toBeInTheDocument();
  });
});
