import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { AdminPropertyDto } from "@portal/contracts";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
}));

import { PropertyTable } from "./property-table";

function buildProperty(
  overrides: Partial<AdminPropertyDto> = {},
): AdminPropertyDto {
  return {
    id: "prop-1",
    title: "Casa en Ñuñoa",
    description: "Una casa.",
    operationType: "SALE",
    propertyType: "HOUSE",
    price: 250_000,
    currency: "USD",
    usableAreaSquareMeters: null,
    totalAreaSquareMeters: null,
    bedrooms: null,
    bathrooms: null,
    parkingSpaces: null,
    ageYears: null,
    address: "Av. Siempre Viva 742",
    commune: "Ñuñoa",
    city: "Santiago",
    region: "Región Metropolitana",
    isPublished: true,
    isFeatured: false,
    features: [],
    images: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("PropertyTable", () => {
  it("distingue lo publicado de un borrador con texto, no solo con color", () => {
    render(
      <PropertyTable
        properties={[
          buildProperty(),
          buildProperty({ id: "prop-2", isPublished: false }),
        ]}
      />,
    );

    expect(screen.getByText("Publicada")).toBeVisible();
    expect(screen.getByText("Borrador")).toBeVisible();
  });

  it("muestra los borradores, que el catálogo público no expone", () => {
    render(
      <PropertyTable
        properties={[
          buildProperty({ title: "Sin terminar", isPublished: false }),
        ]}
      />,
    );

    expect(screen.getByText("Sin terminar")).toBeVisible();
  });

  it("lleva a editar cada propiedad", () => {
    render(<PropertyTable properties={[buildProperty()]} />);

    expect(
      screen.getByRole("link", { name: /Editar la propiedad Casa en Ñuñoa/ }),
    ).toHaveAttribute("href", "/admin/properties/prop-1/edit");
  });

  it("señala el precio de un arriendo como mensual", () => {
    render(
      <PropertyTable
        properties={[buildProperty({ operationType: "RENT", price: 1200 })]}
      />,
    );

    expect(screen.getByText(/\/mes$/)).toBeVisible();
  });

  it("marca las destacadas", () => {
    render(
      <PropertyTable properties={[buildProperty({ isFeatured: true })]} />,
    );

    expect(screen.getByText("Destacada")).toBeVisible();
  });

  it("da a cada fila su propio botón de eliminar", () => {
    render(
      <PropertyTable
        properties={[
          buildProperty(),
          buildProperty({ id: "prop-2", title: "Depto en Providencia" }),
        ]}
      />,
    );

    const filas = within(screen.getByRole("table")).getAllByRole("row");

    // La primera fila es la de encabezados.
    expect(filas).toHaveLength(3);
    expect(
      screen.getByRole("button", {
        name: /Eliminar la propiedad Depto en Providencia/,
      }),
    ).toBeVisible();
  });
});
