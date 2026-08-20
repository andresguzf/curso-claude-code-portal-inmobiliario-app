import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

import {
  countActiveFilters,
  PropertyFilters,
  type PropertyFilterValues,
} from "./property-filters";

function buildValues(
  overrides: Partial<PropertyFilterValues> = {},
): PropertyFilterValues {
  return {
    search: "",
    minPrice: "",
    maxPrice: "",
    status: "",
    types: [],
    operations: [],
    publishedFrom: "",
    publishedTo: "",
    ...overrides,
  };
}

function renderFilters(overrides: Partial<PropertyFilterValues> = {}) {
  return render(<PropertyFilters values={buildValues(overrides)} />);
}

/** Los parámetros de la última navegación provocada por el panel. */
function lastQuery(): URLSearchParams {
  const href = push.mock.calls.at(-1)?.[0] as string;

  return new URLSearchParams(href.split("?")[1] ?? "");
}

afterEach(() => {
  push.mockReset();
});

describe("countActiveFilters", () => {
  it("no cuenta la búsqueda, que tiene su propio campo a la vista", () => {
    expect(countActiveFilters(buildValues({ search: "casa" }))).toBe(0);
  });

  it("no cuenta «todas», que es la ausencia del filtro de estado", () => {
    expect(countActiveFilters(buildValues({ status: "all" }))).toBe(0);
    expect(countActiveFilters(buildValues({ status: "draft" }))).toBe(1);
  });

  it("cuenta cada grupo una sola vez", () => {
    expect(
      countActiveFilters(buildValues({ types: ["HOUSE", "APARTMENT"] })),
    ).toBe(1);
  });

  it("suma los grupos distintos", () => {
    expect(
      countActiveFilters(
        buildValues({ status: "draft", minPrice: "100", types: ["HOUSE"] }),
      ),
    ).toBe(3);
  });
});

describe("PropertyFilters", () => {
  it("sigue funcionando sin JavaScript", () => {
    const { container } = renderFilters();
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/admin/properties");
  });

  it("empieza abierto", () => {
    renderFilters();

    expect(screen.getByRole("button", { name: /Filtros/ })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("se contrae y vuelve a abrirse", async () => {
    const user = userEvent.setup();

    renderFilters();
    const toggle = screen.getByRole("button", { name: /Filtros/ });

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("avisa cuántos filtros hay puestos", () => {
    renderFilters({ status: "draft", minPrice: "1000" });

    expect(
      screen.getByRole("button", { name: "Filtros, 2 aplicados" }),
    ).toBeVisible();
  });

  it("concuerda el número al anunciar un solo filtro", () => {
    renderFilters({ status: "draft" });

    expect(
      screen.getByRole("button", { name: "Filtros, 1 aplicado" }),
    ).toBeVisible();
  });

  it("se pinta marcado como está la URL", () => {
    renderFilters({
      status: "draft",
      types: ["HOUSE"],
      operations: ["RENT"],
      minPrice: "1000",
      publishedFrom: "2026-01-01",
    });

    expect(screen.getByRole("radio", { name: "Borradores" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Casa" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Arriendo" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Venta" })).not.toBeChecked();
    expect(
      screen.getByLabelText("Desde", { selector: "#filtro-precio-min" }),
    ).toHaveValue(1000);
  });

  it("marca «todas» cuando la URL no pide estado", () => {
    renderFilters();

    expect(screen.getByRole("radio", { name: "Todas" })).toBeChecked();
  });

  it("lleva los filtros a la URL", async () => {
    const user = userEvent.setup();

    renderFilters();
    await user.click(screen.getByRole("radio", { name: "Borradores" }));
    await user.click(screen.getByRole("checkbox", { name: "Casa" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastQuery().get("status")).toBe("draft");
    expect(lastQuery().get("type")).toBe("HOUSE");
  });

  it("repite el parámetro cuando se eligen varios tipos", async () => {
    const user = userEvent.setup();

    renderFilters();
    await user.click(screen.getByRole("checkbox", { name: "Casa" }));
    await user.click(screen.getByRole("checkbox", { name: "Departamento" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastQuery().getAll("type")).toEqual(["HOUSE", "APARTMENT"]);
  });

  it("no deja parámetros vacíos en la URL", async () => {
    const user = userEvent.setup();

    renderFilters();
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/properties"));
  });

  it("no envía «todas», que es no filtrar por estado", async () => {
    const user = userEvent.setup();

    renderFilters({ status: "draft" });
    await user.click(screen.getByRole("radio", { name: "Todas" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/properties"));
  });

  it("conserva la búsqueda al filtrar", async () => {
    const user = userEvent.setup();

    // La búsqueda vive en otro campo de la página: filtrar no debe perderla.
    renderFilters({ search: "ñuñoa" });
    await user.click(screen.getByRole("radio", { name: "Publicadas" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastQuery().get("search")).toBe("ñuñoa");
  });

  it("vuelve a la primera página al filtrar", async () => {
    const user = userEvent.setup();

    // La página que se estaba viendo no tiene por qué existir en el
    // resultado filtrado.
    renderFilters();
    await user.click(screen.getByRole("radio", { name: "Publicadas" }));
    await user.click(screen.getByRole("button", { name: "Aplicar" }));

    await waitFor(() => expect(push).toHaveBeenCalled());
    expect(lastQuery().has("page")).toBe(false);
  });

  it("solo ofrece limpiar si hay algo que limpiar", () => {
    const { rerender } = renderFilters();

    expect(screen.queryByRole("link", { name: "Limpiar" })).toBeNull();

    rerender(<PropertyFilters values={buildValues({ status: "draft" })} />);

    expect(screen.getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/admin/properties",
    );
  });

  it("limpiar quita los filtros pero conserva la búsqueda", () => {
    // Son dos cosas distintas y están en dos sitios distintos.
    renderFilters({ status: "draft", search: "ñuñoa" });

    expect(screen.getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/admin/properties?search=%C3%B1u%C3%B1oa",
    );
  });
});
