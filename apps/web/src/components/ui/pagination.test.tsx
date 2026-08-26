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

    expect(screen.queryByRole("link", { name: /Página anterior/ })).toBeNull();
    expect(screen.getByText(/Página anterior/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: /Página siguiente/ }),
    ).toBeVisible();
  });

  it("omite el parámetro de la primera página", () => {
    // Una URL con `?page=1` es la misma que sin él, y ensucia lo que se
    // comparte.
    renderPagination({ currentPage: 2 });

    expect(
      screen.getByRole("link", { name: /Página anterior/ }),
    ).toHaveAttribute("href", "/admin/properties");
  });

  it("conserva la búsqueda y los filtros al cambiar de página", () => {
    // Si se perdieran, la segunda página mostraría otro listado que la
    // primera.
    renderPagination({
      preserved: new URLSearchParams("search=ñuñoa&status=draft&type=HOUSE"),
    });

    const href = screen
      .getByRole("link", { name: /Página siguiente/ })
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

    expect(
      screen.getByRole("link", { name: /Página anterior/ }),
    ).toHaveAttribute("href", "/admin/properties?status=draft");
  });

  it("salta al ancla del listado cuando se le da una", () => {
    renderPagination({
      basePath: "/account",
      hash: "#mis-consultas",
      preserved: new URLSearchParams(),
    });

    expect(
      screen.getByRole("link", { name: /Página siguiente/ }),
    ).toHaveAttribute("href", "/account?page=3#mis-consultas");
  });
});

describe("Pagination: primera, última y rangos", () => {
  function pintar(currentPage: number, lastPage: number) {
    render(
      <Pagination
        basePath="/properties"
        currentPage={currentPage}
        lastPage={lastPage}
        preserved={new URLSearchParams()}
        label="Paginación del catálogo"
      />,
    );
  }

  it("ofrece siempre primera y última", () => {
    pintar(20, 40);

    expect(
      screen.getByRole("link", { name: /Primera página/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Última página/ }),
    ).toBeInTheDocument();
  });

  it("enumera tres páginas a cada lado de la actual", () => {
    pintar(20, 40);

    for (const pagina of [17, 18, 19, 21, 22, 23]) {
      expect(
        screen.getByRole("link", { name: new RegExp(`Página ${pagina}$`) }),
      ).toBeInTheDocument();
    }
    // La 16 y la 24 quedan fuera de la ventana.
    expect(screen.queryByRole("link", { name: /Página 16$/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Página 24$/ })).toBeNull();
  });

  it("separa los tramos con puntos suspensivos", () => {
    pintar(20, 40);

    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("la página actual no es un enlace y se anuncia como tal", () => {
    pintar(20, 40);

    expect(screen.queryByRole("link", { name: /Página 20$/ })).toBeNull();

    // El color por sí solo no dice cuál es la actual: se anuncia con
    // `aria-current`, que es lo que lee un lector de pantalla.
    const actual = document.querySelector('[aria-current="page"]');

    expect(actual).not.toBeNull();
    expect(actual?.textContent).toContain("20");
  });

  it("en la primera página, primera y anterior dejan de ser enlaces", () => {
    pintar(1, 40);

    expect(screen.queryByRole("link", { name: /Primera página/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Página anterior/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: /Última página/ }),
    ).toBeInTheDocument();
  });

  it("en la última, siguiente y última dejan de ser enlaces", () => {
    pintar(40, 40);

    expect(screen.queryByRole("link", { name: /Página siguiente/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /Última página/ })).toBeNull();
    expect(
      screen.getByRole("link", { name: /Primera página/ }),
    ).toBeInTheDocument();
  });

  it("con pocas páginas no hay separadores", () => {
    pintar(2, 4);

    expect(screen.queryByText("…")).toBeNull();
  });
});
