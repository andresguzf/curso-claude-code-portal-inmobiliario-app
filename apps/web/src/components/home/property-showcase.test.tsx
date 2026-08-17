import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { PropertySummaryDto } from "@portal/contracts";

import { buildPropertySummary } from "@/test-support/property-fixtures";

import { PropertyShowcase } from "./property-showcase";

function renderShowcase(properties: readonly PropertySummaryDto[]) {
  return render(
    <PropertyShowcase
      id="titulo-venta"
      title="Propiedades en venta"
      description="Disponibles para comprar."
      properties={properties}
      linkHref="/properties?operation=SALE"
      linkLabel="Ver todas en venta"
    />,
  );
}

describe("PropertyShowcase", () => {
  it("no renderiza la sección cuando no hay propiedades", () => {
    const { container } = renderShowcase([]);

    expect(container).toBeEmptyDOMElement();
  });

  it("titula la sección y la describe", () => {
    renderShowcase([buildPropertySummary()]);

    const section = screen.getByRole("region", {
      name: "Propiedades en venta",
    });

    expect(
      within(section).getByRole("heading", {
        level: 2,
        name: "Propiedades en venta",
      }),
    ).toBeVisible();
    expect(
      within(section).getByText("Disponibles para comprar."),
    ).toBeVisible();
  });

  it("enlaza al catálogo filtrado", () => {
    renderShowcase([buildPropertySummary()]);

    expect(
      screen.getByRole("link", { name: "Ver todas en venta" }),
    ).toHaveAttribute("href", "/properties?operation=SALE");
  });

  it("delega el listado en la cuadrícula de propiedades", () => {
    renderShowcase([
      buildPropertySummary({ id: "a", title: "Casa en Las Condes" }),
      buildPropertySummary({ id: "b", title: "Departamento en Ñuñoa" }),
    ]);

    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(2);
    expect(
      screen.getByRole("heading", { level: 3, name: "Departamento en Ñuñoa" }),
    ).toBeVisible();
  });
});
