import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertySearchForm } from "./property-search-form";

describe("PropertySearchForm", () => {
  it("envía la búsqueda al catálogo por GET, sin Server Actions", () => {
    render(<PropertySearchForm />);

    const form = screen.getByRole("search");

    expect(form).toHaveAttribute("action", "/properties");
    expect(form).toHaveAttribute("method", "get");
  });

  it("nombra los campos según los parámetros de la especificación", () => {
    render(<PropertySearchForm />);

    expect(screen.getByLabelText("¿Dónde quieres vivir?")).toHaveAttribute(
      "name",
      "search",
    );
    expect(screen.getByLabelText("Operación")).toHaveAttribute(
      "name",
      "operation",
    );
  });

  it("ofrece filtrar por venta o arriendo, con ambas por omisión", () => {
    render(<PropertySearchForm />);

    const operationSelect = screen.getByLabelText<HTMLSelectElement>(
      "Operación",
    );

    expect(operationSelect.value).toBe("");
    expect(
      [...operationSelect.options].map((option) => option.value),
    ).toEqual(["", "SALE", "RENT"]);
  });

  it("expone un botón de envío accesible", () => {
    render(<PropertySearchForm />);

    expect(screen.getByRole("button", { name: "Buscar" })).toHaveAttribute(
      "type",
      "submit",
    );
  });
});
