import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { replace, searchParams } = vi.hoisted(() => ({
  replace: vi.fn(),
  searchParams: { value: new URLSearchParams() },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn(), refresh: vi.fn() }),
  useSearchParams: () => searchParams.value,
}));

import { SearchForm } from "./search-form";

function renderForm(overrides = {}) {
  return render(
    <SearchForm
      basePath="/admin/properties"
      search=""
      label="Buscar propiedades"
      placeholder="Título, comuna o ciudad"
      {...overrides}
    />,
  );
}

afterEach(() => {
  replace.mockReset();
  searchParams.value = new URLSearchParams();
});

describe("SearchForm", () => {
  it("sigue funcionando sin JavaScript", () => {
    // Es un formulario de verdad: el navegador sabe enviarlo por su cuenta.
    const { container } = renderForm();
    const form = container.querySelector("form");

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/admin/properties");
  });

  it("lleva el término a la URL", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.type(screen.getByLabelText("Buscar propiedades"), "ñuñoa");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(replace).toHaveBeenCalledWith(
      "/admin/properties?search=%C3%B1u%C3%B1oa",
    );
  });

  it("no deja parámetros vacíos en la URL", async () => {
    const user = userEvent.setup();

    renderForm({ search: "ñuñoa" });
    await user.clear(screen.getByLabelText("Buscar propiedades"));
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(replace).toHaveBeenCalledWith("/admin/properties");
  });

  it("vuelve a la primera página al buscar de nuevo", async () => {
    const user = userEvent.setup();

    // La página que se estaba viendo no tiene por qué existir en el
    // resultado filtrado.
    searchParams.value = new URLSearchParams("page=4");

    renderForm();
    await user.type(screen.getByLabelText("Buscar propiedades"), "casa");
    await user.click(screen.getByRole("button", { name: "Buscar" }));

    expect(replace).toHaveBeenCalledWith("/admin/properties?search=casa");
  });

  it("solo ofrece limpiar si hay algo que limpiar", () => {
    const { rerender } = renderForm();

    expect(screen.queryByRole("link", { name: "Limpiar" })).toBeNull();

    rerender(
      <SearchForm
        basePath="/admin/properties"
        search="casa"
        label="Buscar propiedades"
        placeholder="Título, comuna o ciudad"
      />,
    );

    expect(screen.getByRole("link", { name: "Limpiar" })).toHaveAttribute(
      "href",
      "/admin/properties",
    );
  });
});
