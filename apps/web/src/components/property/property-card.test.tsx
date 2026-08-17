import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildPropertySummary } from "@/test-support/property-fixtures";

import { PropertyCard } from "./property-card";

describe("PropertyCard", () => {
  it("muestra los datos que exige la especificación", () => {
    render(<PropertyCard property={buildPropertySummary()} />);

    expect(
      screen.getByRole("heading", { level: 3, name: "Casa en Las Condes" }),
    ).toBeVisible();
    expect(screen.getByText("Venta · Casa")).toBeVisible();
    expect(screen.getByText(/890\.000/)).toBeVisible();
    expect(screen.getByText("Las Condes, Santiago")).toBeVisible();
    expect(screen.getByText("4")).toBeVisible();
    expect(screen.getByText("3")).toBeVisible();
    expect(screen.getByText("180 m²")).toBeVisible();
  });

  it("enlaza al detalle de la propiedad", () => {
    render(
      <PropertyCard
        property={buildPropertySummary({ id: "seed-property-01" })}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Casa en Las Condes" }),
    ).toHaveAttribute("href", "/properties/seed-property-01");
  });

  it("expone un único enlace, aunque el área pulsable cubra la tarjeta", () => {
    render(<PropertyCard property={buildPropertySummary()} />);

    expect(screen.getAllByRole("link")).toHaveLength(1);
  });

  it("describe la imagen con texto alternativo", () => {
    render(<PropertyCard property={buildPropertySummary()} />);

    expect(
      screen.getByRole("img", { name: "Fotografía de Casa en Las Condes" }),
    ).toBeVisible();
  });

  it("indica cuando la propiedad no tiene fotografía", () => {
    render(
      <PropertyCard property={buildPropertySummary({ primaryImage: null })} />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("Sin fotografía")).toBeVisible();
  });

  it("marca las propiedades destacadas", () => {
    render(
      <PropertyCard property={buildPropertySummary({ isFeatured: true })} />,
    );

    expect(screen.getByText("Destacada")).toBeVisible();
  });

  it("no marca las propiedades que no están destacadas", () => {
    render(
      <PropertyCard property={buildPropertySummary({ isFeatured: false })} />,
    );

    expect(screen.queryByText("Destacada")).not.toBeInTheDocument();
  });

  it("omite dormitorios, baños y superficie en un terreno", () => {
    render(
      <PropertyCard
        property={buildPropertySummary({
          propertyType: "LAND",
          bedrooms: null,
          bathrooms: null,
          usableAreaSquareMeters: null,
        })}
      />,
    );

    expect(screen.queryByText("Dormitorios:")).not.toBeInTheDocument();
    expect(screen.queryByText("Baños:")).not.toBeInTheDocument();
    expect(screen.queryByText("Útil:")).not.toBeInTheDocument();
    expect(screen.getByText("Venta · Terreno")).toBeVisible();
  });

  it("muestra el precio de arriendo como mensual", () => {
    render(
      <PropertyCard
        property={buildPropertySummary({ operationType: "RENT", price: 1800 })}
      />,
    );

    expect(screen.getByText(/1\.800\/mes/)).toBeVisible();
  });

  it("usa el descriptor de tamaños que recibe del contenedor", () => {
    render(
      <PropertyCard
        property={buildPropertySummary()}
        imageSizes="(min-width: 640px) 50vw, 100vw"
      />,
    );

    expect(screen.getByRole("img")).toHaveAttribute(
      "sizes",
      "(min-width: 640px) 50vw, 100vw",
    );
  });
});
