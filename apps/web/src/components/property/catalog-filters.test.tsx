import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type {
  PropertyFilterOptionsDto,
  PropertyListQuery,
} from "@portal/contracts";

import { CatalogFilters, buildCatalogHref } from "./catalog-filters";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

afterEach(() => {
  push.mockReset();
});

const options: PropertyFilterOptionsDto = {
  communes: ["Las Condes", "Ñuñoa", "Providencia"],
  cities: ["Santiago", "Viña del Mar"],
  regions: ["Región Metropolitana", "Región de Valparaíso"],
};

function renderFilters(query: PropertyListQuery = {}) {
  const activeFilterCount = Object.values(query).filter((value) =>
    Array.isArray(value) ? value.length > 0 : value !== undefined,
  ).length;

  return render(
    <CatalogFilters
      query={query}
      options={options}
      hasActiveFilters={activeFilterCount > 0}
      activeFilterCount={activeFilterCount}
    />,
  );
}

function group(legend: string) {
  return screen.getByRole("group", { name: legend });
}

function checkbox(legend: string, label: string) {
  return within(group(legend)).getByRole<HTMLInputElement>("checkbox", {
    name: label,
  });
}

function radio(legend: string, label: string) {
  return within(group(legend)).getByRole<HTMLInputElement>("radio", {
    name: label,
  });
}

/**
 * Los dos botones comparten rótulo y solo uno se muestra a la vez, según el
 * punto de ruptura. jsdom no aplica las clases de Tailwind, así que aquí se
 * identifican por su atributo.
 */
function toggleFor(breakpoint: "mobile" | "desktop") {
  const toggle = document.querySelector<HTMLButtonElement>(
    `button[data-breakpoint="${breakpoint}"]`,
  );

  if (!toggle) {
    throw new Error(`No existe el botón de ${breakpoint}`);
  }

  return toggle;
}

function panel() {
  return screen.getByRole("search", { name: "Búsqueda y filtros" });
}

describe("CatalogFilters — barra lateral colapsable", () => {
  it("se presenta como región complementaria titulada", () => {
    renderFilters();

    expect(
      screen.getByRole("heading", { level: 2, name: /Filtros/ }),
    ).toBeVisible();
  });

  it("arranca cerrada en móvil y abierta en escritorio", () => {
    renderFilters();

    expect(toggleFor("mobile")).toHaveAttribute("aria-expanded", "false");
    expect(toggleFor("mobile")).toHaveAttribute(
      "aria-label",
      "Mostrar filtros",
    );

    expect(toggleFor("desktop")).toHaveAttribute("aria-expanded", "true");
    expect(toggleFor("desktop")).toHaveAttribute(
      "aria-label",
      "Ocultar filtros",
    );
  });

  it("usa un ícono con nombre accesible en lugar de texto", () => {
    renderFilters();

    const toggle = toggleFor("desktop");

    // El ícono es decorativo: el nombre lo aporta `aria-label`.
    expect(toggle.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(toggle).toHaveTextContent("");
    expect(
      screen.getByRole("button", { name: "Ocultar filtros" }),
    ).toBeInTheDocument();
  });

  it("orienta el ícono según hacia dónde se mueve el panel", async () => {
    const user = userEvent.setup();
    renderFilters();

    // Escritorio: barra lateral que se retrae a la izquierda.
    const desktopOpen = toggleFor("desktop").innerHTML;
    expect(desktopOpen).toContain("M11 17l-5-5 5-5");

    await user.click(toggleFor("desktop"));
    expect(toggleFor("desktop").innerHTML).toContain("M13 7l5 5-5 5");

    // Móvil: bloque que se despliega hacia abajo.
    expect(toggleFor("mobile").innerHTML).toContain("M6 9l6 6 6-6");

    await user.click(toggleFor("mobile"));
    expect(toggleFor("mobile").innerHTML).toContain("M6 15l6-6 6 6");
  });

  it("oculta el panel en móvil y lo muestra en escritorio por omisión", () => {
    renderFilters();

    // El panel es único: las clases deciden en qué ancho se ve.
    expect(panel()).toHaveClass("hidden");
    expect(panel()).toHaveClass("lg:flex");
  });

  it("despliega el panel en móvil sin afectar a escritorio", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(toggleFor("mobile"));

    expect(toggleFor("mobile")).toHaveAttribute("aria-expanded", "true");
    expect(panel()).toHaveClass("flex");
    expect(panel()).not.toHaveClass("hidden");
    expect(toggleFor("desktop")).toHaveAttribute("aria-expanded", "true");
  });

  it("colapsa el panel en escritorio sin afectar a móvil", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(toggleFor("desktop"));

    expect(toggleFor("desktop")).toHaveAttribute("aria-expanded", "false");
    expect(panel()).toHaveClass("lg:hidden");
    expect(panel()).not.toHaveClass("lg:flex");
    expect(toggleFor("mobile")).toHaveAttribute("aria-expanded", "false");
  });

  it("vuelve a desplegar tras colapsar", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(toggleFor("desktop"));
    await user.click(toggleFor("desktop"));

    expect(toggleFor("desktop")).toHaveAttribute("aria-expanded", "true");
    expect(panel()).toHaveClass("lg:flex");
  });

  it("conecta ambos botones con el panel que controlan", () => {
    renderFilters();

    for (const breakpoint of ["mobile", "desktop"] as const) {
      expect(toggleFor(breakpoint)).toHaveAttribute(
        "aria-controls",
        panel().id,
      );
    }
  });

  it("fuerza el panel visible cuando no hay JavaScript", () => {
    const { container } = renderFilters();

    const fallback = container.querySelector("noscript");

    expect(fallback?.innerHTML).toContain(panel().id);
    expect(fallback?.innerHTML).toContain("display:flex !important");
  });

  it("indica cuántos filtros hay aplicados", () => {
    renderFilters({ operations: ["SALE"], communes: ["Ñuñoa"], bedrooms: 3 });

    expect(
      within(screen.getByRole("heading", { level: 2 })).getByText("3"),
    ).toBeVisible();
  });

  it("no muestra contador sin filtros aplicados", () => {
    renderFilters();

    expect(
      screen.getByRole("heading", { level: 2, name: "Filtros" }),
    ).toBeVisible();
  });
});

describe("CatalogFilters — controles", () => {
  it("usa casillas para operación, que admite ambas", () => {
    renderFilters();

    expect(checkbox("Operación", "Venta")).toBeInTheDocument();
    expect(checkbox("Operación", "Arriendo")).toBeInTheDocument();
  });

  it("usa casillas para los seis tipos de propiedad", () => {
    renderFilters();

    for (const label of [
      "Casa",
      "Departamento",
      "Terreno",
      "Oficina",
      "Local comercial",
      "Otro",
    ]) {
      expect(checkbox("Tipo de propiedad", label)).toBeInTheDocument();
    }
  });

  it("usa casillas para comuna, que admite varias", () => {
    renderFilters();

    for (const commune of options.communes) {
      expect(checkbox("Comuna", commune)).toBeInTheDocument();
    }
  });

  it("usa opciones excluyentes para los mínimos de dormitorios", () => {
    renderFilters();

    expect(radio("Dormitorios", "Cualquiera")).toBeChecked();
    expect(radio("Dormitorios", "3 o más")).not.toBeChecked();
  });

  it("apila en vertical los grupos con muchas opciones", () => {
    renderFilters();

    // El contenedor de opciones es el hermano de la leyenda.
    for (const legend of ["Tipo de propiedad", "Dormitorios", "Baños"]) {
      const options = group(legend).querySelector("legend + div");

      expect(options, legend).toHaveClass("flex-col");
      expect(options, legend).not.toHaveClass("flex-wrap");
    }
  });

  it("deja operación en línea, que solo tiene dos opciones", () => {
    renderFilters();

    const options = group("Operación").querySelector("legend + div");

    expect(options).toHaveClass("flex-wrap");
    expect(options).not.toHaveClass("flex-col");
  });

  it("mantiene ciudad y región como lista desplegable", () => {
    renderFilters();

    expect(
      [...screen.getByLabelText<HTMLSelectElement>("Ciudad").options].map(
        (option) => option.value,
      ),
    ).toEqual(["", "Santiago", "Viña del Mar"]);
    expect(
      [...screen.getByLabelText<HTMLSelectElement>("Región").options].map(
        (option) => option.value,
      ),
    ).toEqual(["", "Región Metropolitana", "Región de Valparaíso"]);
  });

  it("nombra los campos según los parámetros de la especificación", () => {
    renderFilters();

    expect(checkbox("Operación", "Venta")).toHaveAttribute("name", "operation");
    expect(checkbox("Tipo de propiedad", "Casa")).toHaveAttribute(
      "name",
      "type",
    );
    expect(checkbox("Comuna", "Ñuñoa")).toHaveAttribute("name", "commune");
    expect(radio("Dormitorios", "3 o más")).toHaveAttribute("name", "bedrooms");
    expect(screen.getByLabelText("Ciudad")).toHaveAttribute("name", "city");
    expect(screen.getByLabelText("Región")).toHaveAttribute("name", "region");
    expect(screen.getByLabelText("Buscar")).toHaveAttribute("name", "search");
  });
});

describe("CatalogFilters — estado vigente", () => {
  it("marca las casillas de los filtros aplicados", () => {
    renderFilters({
      operations: ["RENT"],
      types: ["APARTMENT", "HOUSE"],
      communes: ["Las Condes", "Providencia"],
    });

    expect(checkbox("Operación", "Arriendo")).toBeChecked();
    expect(checkbox("Operación", "Venta")).not.toBeChecked();
    expect(checkbox("Tipo de propiedad", "Departamento")).toBeChecked();
    expect(checkbox("Tipo de propiedad", "Casa")).toBeChecked();
    expect(checkbox("Tipo de propiedad", "Terreno")).not.toBeChecked();
    expect(checkbox("Comuna", "Las Condes")).toBeChecked();
    expect(checkbox("Comuna", "Providencia")).toBeChecked();
    expect(checkbox("Comuna", "Ñuñoa")).not.toBeChecked();
  });

  it("marca el mínimo de dormitorios y baños vigente", () => {
    renderFilters({ bedrooms: 3, bathrooms: 2 });

    expect(radio("Dormitorios", "3 o más")).toBeChecked();
    expect(radio("Dormitorios", "Cualquiera")).not.toBeChecked();
    expect(radio("Baños", "2 o más")).toBeChecked();
  });

  it("conserva los valores numéricos y de texto", () => {
    renderFilters({
      search: "parque",
      minPrice: 800,
      maxPrice: 2000,
      minUsableArea: 50,
      city: "Santiago",
      region: "Región Metropolitana",
    });

    expect(screen.getByLabelText<HTMLInputElement>("Buscar").value).toBe(
      "parque",
    );
    expect(screen.getByLabelText<HTMLInputElement>("Desde").value).toBe("800");
    expect(screen.getByLabelText<HTMLInputElement>("Hasta").value).toBe("2000");
    expect(
      screen.getByLabelText<HTMLInputElement>("Superficie útil mínima (m²)")
        .value,
    ).toBe("50");
    expect(screen.getByLabelText<HTMLSelectElement>("Ciudad").value).toBe(
      "Santiago",
    );
  });

  it("no pierde una comuna que ya no está entre las opciones", () => {
    renderFilters({ communes: ["Concón"] });

    expect(checkbox("Comuna", "Concón")).toBeChecked();
  });

  it("avisa cuando no hay comunas disponibles", () => {
    render(
      <CatalogFilters
        query={{}}
        options={{ communes: [], cities: [], regions: [] }}
        hasActiveFilters={false}
        activeFilterCount={0}
      />,
    );

    expect(screen.getByText("Sin comunas disponibles.")).toBeVisible();
  });

  it("ofrece limpiar solo cuando hay filtros activos", () => {
    renderFilters({ operations: ["SALE"] });

    expect(
      screen.getByRole("link", { name: "Limpiar filtros" }),
    ).toHaveAttribute("href", "/properties");
  });

  it("no ofrece limpiar cuando no hay filtros activos", () => {
    renderFilters();

    expect(
      screen.queryByRole("link", { name: "Limpiar filtros" }),
    ).not.toBeInTheDocument();
  });
});

describe("buildCatalogHref", () => {
  it("omite los campos vacíos que envía un formulario nativo", () => {
    const href = buildCatalogHref([
      ["search", ""],
      ["operation", "SALE"],
      ["minPrice", ""],
      ["bedrooms", "3"],
      ["commune", "Las Condes"],
      ["city", ""],
    ]);

    expect(href).toBe(
      "/properties?operation=SALE&bedrooms=3&commune=Las+Condes",
    );
  });

  it("conserva los valores repetidos de un filtro múltiple", () => {
    const href = buildCatalogHref([
      ["commune", "Las Condes"],
      ["commune", "Providencia"],
      ["type", "HOUSE"],
      ["type", "APARTMENT"],
    ]);

    const params = new URLSearchParams(href.split("?")[1]);

    expect(params.getAll("commune")).toEqual(["Las Condes", "Providencia"]);
    expect(params.getAll("type")).toEqual(["HOUSE", "APARTMENT"]);
  });

  it("recorta los espacios de los extremos", () => {
    expect(buildCatalogHref([["search", "  parque  "]])).toBe(
      "/properties?search=parque",
    );
  });

  it("descarta un campo con solo espacios", () => {
    expect(buildCatalogHref([["search", "   "]])).toBe("/properties");
  });

  it("vuelve al catálogo sin parámetros cuando todo está vacío", () => {
    expect(
      buildCatalogHref([
        ["search", ""],
        ["operation", ""],
        ["bedrooms", ""],
      ]),
    ).toBe("/properties");
  });

  it("codifica los acentos", () => {
    expect(buildCatalogHref([["commune", "Ñuñoa"]])).toBe(
      "/properties?commune=%C3%91u%C3%B1oa",
    );
  });
});

describe("CatalogFilters — envío", () => {
  it("navega a una URL limpia, sin los campos vacíos", async () => {
    const user = userEvent.setup();
    renderFilters({ operations: ["SALE"], bedrooms: 3 });

    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(push).toHaveBeenCalledWith("/properties?operation=SALE&bedrooms=3");
  });

  it("envía varias comunas cuando se marcan dos casillas", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(checkbox("Comuna", "Las Condes"));
    await user.click(checkbox("Comuna", "Providencia"));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const href = push.mock.calls[0]?.[0] as string;

    expect(new URLSearchParams(href.split("?")[1]).getAll("commune")).toEqual([
      "Las Condes",
      "Providencia",
    ]);
  });

  it("envía varios tipos cuando se marcan dos casillas", async () => {
    const user = userEvent.setup();
    renderFilters();

    await user.click(checkbox("Tipo de propiedad", "Casa"));
    await user.click(checkbox("Tipo de propiedad", "Departamento"));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const href = push.mock.calls[0]?.[0] as string;

    expect(new URLSearchParams(href.split("?")[1]).getAll("type")).toEqual([
      "HOUSE",
      "APARTMENT",
    ]);
  });

  it("omite el mínimo de dormitorios al elegir «Cualquiera»", async () => {
    const user = userEvent.setup();
    renderFilters({ bedrooms: 3 });

    await user.click(radio("Dormitorios", "Cualquiera"));
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    expect(push).toHaveBeenCalledWith("/properties");
  });

  it("conserva los filtros ya aplicados al agregar uno nuevo", async () => {
    const user = userEvent.setup();
    renderFilters({ operations: ["SALE"], communes: ["Las Condes"] });

    await user.selectOptions(screen.getByLabelText("Región"), [
      "Región Metropolitana",
    ]);
    await user.click(screen.getByRole("button", { name: "Aplicar filtros" }));

    const params = new URLSearchParams(
      (push.mock.calls[0]?.[0] as string).split("?")[1],
    );

    expect(params.getAll("operation")).toEqual(["SALE"]);
    expect(params.getAll("commune")).toEqual(["Las Condes"]);
    expect(params.get("region")).toBe("Región Metropolitana");
    expect(params.get("search")).toBeNull();
  });

  it("mantiene el envío nativo como respaldo sin JavaScript", () => {
    renderFilters();

    const form = screen.getByRole("search", { name: "Búsqueda y filtros" });

    expect(form).toHaveAttribute("action", "/properties");
    expect(form).toHaveAttribute("method", "get");
  });
});
