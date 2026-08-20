import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Pagination } from "./pagination";

function renderPagination(overrides = {}) {
  return render(
    <Pagination
      basePath="/admin/properties"
      currentPage={2}
      lastPage={3}
      preserved={new URLSearchParams()}
      label="Páginas de propiedades"
      {...overrides}
    />,
  );
}

describe("Pagination", () => {
  it("no se pinta con una sola página", () => {
    // Unos controles inertes solo ocupan sitio.
    renderPagination({ currentPage: 1, lastPage: 1 });

    expect(screen.queryByRole("navigation")).toBeNull();
  });

  it("sitúa a quien navega dentro del recorrido", () => {
    renderPagination();

    expect(screen.getByText("Página 2 de 3")).toBeVisible();
  });

  it("deja de ser enlace en el extremo, en vez de llevar a ninguna parte", () => {
    renderPagination({ currentPage: 1 });

    expect(screen.queryByRole("link", { name: /Anteriores/ })).toBeNull();
    expect(screen.getByText(/Anteriores/)).toBeVisible();
    expect(screen.getByRole("link", { name: /Siguientes/ })).toBeVisible();
  });

  it("omite el parámetro de la primera página", () => {
    // Una URL con `?page=1` es la misma que sin él, y ensucia lo que se
    // comparte.
    renderPagination({ currentPage: 2 });

    expect(screen.getByRole("link", { name: /Anteriores/ })).toHaveAttribute(
      "href",
      "/admin/properties",
    );
  });

  it("conserva la búsqueda y los filtros al cambiar de página", () => {
    // Si se perdieran, la segunda página mostraría otro listado que la
    // primera.
    renderPagination({
      preserved: new URLSearchParams("search=ñuñoa&status=draft&type=HOUSE"),
    });

    const href = screen
      .getByRole("link", { name: /Siguientes/ })
      .getAttribute("href");
    const query = new URLSearchParams(href?.split("?")[1]);

    expect(query.get("search")).toBe("ñuñoa");
    expect(query.get("status")).toBe("draft");
    expect(query.get("type")).toBe("HOUSE");
    expect(query.get("page")).toBe("3");
  });

  it("descarta la página que traía la URL al retroceder a la primera", () => {
    renderPagination({
      currentPage: 2,
      preserved: new URLSearchParams("status=draft&page=2"),
    });

    expect(screen.getByRole("link", { name: /Anteriores/ })).toHaveAttribute(
      "href",
      "/admin/properties?status=draft",
    );
  });

  it("salta al ancla del listado cuando se le da una", () => {
    renderPagination({
      basePath: "/account",
      hash: "#mis-consultas",
      preserved: new URLSearchParams(),
    });

    expect(screen.getByRole("link", { name: /Siguientes/ })).toHaveAttribute(
      "href",
      "/account?page=3#mis-consultas",
    );
  });
});
