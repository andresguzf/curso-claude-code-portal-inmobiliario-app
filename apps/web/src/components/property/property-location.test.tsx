import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PropertyLocation } from "./property-location";

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("PropertyLocation", () => {
  it("muestra la dirección completa en un elemento address", () => {
    render(
      <PropertyLocation location={LAS_CONDES} mapImageUrl="/api/mapa.png" />,
    );

    expect(
      screen.getByText(
        "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana",
      ).tagName,
    ).toBe("ADDRESS");
  });

  it("muestra el mapa que sirve la propia aplicación", () => {
    render(
      <PropertyLocation
        location={LAS_CONDES}
        mapImageUrl="/api/properties/property-1/map"
      />,
    );

    const map = screen.getByRole("img", {
      name: "Mapa con la ubicación aproximada de la propiedad",
    });

    expect(map).toHaveAttribute("src", "/api/properties/property-1/map");
  });

  it("no pide el mapa a Google desde el navegador", () => {
    const { container } = render(
      <PropertyLocation
        location={LAS_CONDES}
        mapImageUrl="/api/properties/property-1/map"
      />,
    );

    const map = screen.getByRole("img", {
      name: "Mapa con la ubicación aproximada de la propiedad",
    });

    expect(map.getAttribute("src")).not.toContain("googleapis.com");
    // Ninguna clave de API puede aparecer en el marcado servido.
    expect(container.innerHTML).not.toContain("key=");
  });

  it("explica la ausencia del mapa en lugar de dejar un hueco roto", () => {
    render(<PropertyLocation location={LAS_CONDES} mapImageUrl={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.getByText("El mapa no está disponible en este momento."),
    ).toBeInTheDocument();
  });

  it("enlaza a Google Maps aunque no haya mapa incrustado", () => {
    render(<PropertyLocation location={LAS_CONDES} mapImageUrl={null} />);

    const link = screen.getByRole("link", { name: /Ver en Google Maps/ });

    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Avenida+Presidente+Riesco+4520%2C+Las+Condes%2C+Santiago%2C+Regi%C3%B3n+Metropolitana%2C+Chile",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("advierte que el enlace abre una pestaña nueva", () => {
    render(<PropertyLocation location={LAS_CONDES} mapImageUrl={null} />);

    // El aviso forma parte del nombre accesible del enlace, no de un título
    // que solo aparezca al pasar el ratón.
    expect(
      screen.getByRole("link", {
        name: /Ver en Google Maps.*se abre en una pestaña nueva/,
      }),
    ).toBeInTheDocument();
  });
});
