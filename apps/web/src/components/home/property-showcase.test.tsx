import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertyShowcase } from "./property-showcase";
import type { PropertySummaryDto } from "@portal/contracts";

function buildProperty(
  overrides: Partial<PropertySummaryDto> = {},
): PropertySummaryDto {
  return {
    id: "property-1",
    title: "Casa en Las Condes",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 890000,
    currency: "USD",
    commune: "Las Condes",
    city: "Santiago",
    region: "Región Metropolitana",
    bedrooms: 4,
    bathrooms: 3,
    usableAreaSquareMeters: 180,
    isFeatured: false,
    primaryImage: {
      id: "image-1",
      url: "https://picsum.photos/seed/property-1/1200/800",
      publicId: "seed/property-1",
      position: 0,
      isPrimary: true,
    },
    createdAt: "2026-01-15T10:30:00.000Z",
    ...overrides,
  };
}

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

  it("titula la sección y enlaza al catálogo filtrado", () => {
    renderShowcase([buildProperty()]);

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
      within(section).getByRole("link", { name: "Ver todas en venta" }),
    ).toHaveAttribute("href", "/properties?operation=SALE");
  });

  it("muestra los datos que exige la especificación en cada tarjeta", () => {
    renderShowcase([buildProperty()]);

    expect(
      screen.getByRole("heading", { level: 3, name: "Casa en Las Condes" }),
    ).toBeVisible();
    expect(screen.getByText(/890\.000/)).toBeVisible();
    expect(screen.getByText("Venta · Casa")).toBeVisible();
    expect(screen.getByText("Las Condes, Santiago")).toBeVisible();
    expect(screen.getByText("180 m²")).toBeVisible();
  });

  it("enlaza cada tarjeta al detalle de su propiedad", () => {
    renderShowcase([buildProperty({ id: "seed-property-01" })]);

    expect(
      screen.getByRole("link", { name: "Casa en Las Condes" }),
    ).toHaveAttribute("href", "/properties/seed-property-01");
  });

  it("describe la imagen con texto alternativo", () => {
    renderShowcase([buildProperty()]);

    expect(
      screen.getByRole("img", { name: "Fotografía de Casa en Las Condes" }),
    ).toBeVisible();
  });

  it("indica cuando la propiedad no tiene fotografía", () => {
    renderShowcase([buildProperty({ primaryImage: null })]);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Sin fotografía")).toBeVisible();
  });

  it("marca visualmente las propiedades destacadas", () => {
    renderShowcase([buildProperty({ isFeatured: true })]);

    expect(screen.getByText("Destacada")).toBeVisible();
  });

  it("omite dormitorios y baños en un terreno", () => {
    renderShowcase([
      buildProperty({
        propertyType: "LAND",
        bedrooms: null,
        bathrooms: null,
        usableAreaSquareMeters: null,
      }),
    ]);

    expect(screen.queryByText("Dormitorios:")).not.toBeInTheDocument();
    expect(screen.queryByText("Baños:")).not.toBeInTheDocument();
    expect(screen.getByText("Venta · Terreno")).toBeVisible();
  });

  it("muestra el precio de arriendo como mensual", () => {
    renderShowcase([
      buildProperty({ operationType: "RENT", price: 1800 }),
    ]);

    expect(screen.getByText(/1\.800\/mes/)).toBeVisible();
  });
});
