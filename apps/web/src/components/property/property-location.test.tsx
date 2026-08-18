import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/property/property-map", () => ({
  PropertyMap: ({
    coordinates,
  }: {
    coordinates: { latitude: number; longitude: number };
  }) => (
    <div data-testid="mapa">
      {coordinates.latitude},{coordinates.longitude}
    </div>
  ),
}));

import { PropertyLocation } from "./property-location";

const COORDINATES = { latitude: -33.4094935, longitude: -70.5847201 };

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("PropertyLocation", () => {
  it("muestra la dirección completa en un elemento address", () => {
    render(
      <PropertyLocation location={LAS_CONDES} coordinates={COORDINATES} />,
    );

    expect(
      screen.getByText(
        "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana",
      ).tagName,
    ).toBe("ADDRESS");
  });

  it("pasa al mapa las coordenadas que resolvió el backend", () => {
    render(
      <PropertyLocation location={LAS_CONDES} coordinates={COORDINATES} />,
    );

    expect(screen.getByTestId("mapa")).toHaveTextContent(
      "-33.4094935,-70.5847201",
    );
  });

  it("explica la ausencia del mapa en lugar de dejar un hueco roto", () => {
    render(<PropertyLocation location={LAS_CONDES} coordinates={null} />);

    expect(screen.queryByTestId("mapa")).not.toBeInTheDocument();
    expect(
      screen.getByText("El mapa no está disponible en este momento."),
    ).toBeInTheDocument();
  });

  it("enlaza a Google Maps aunque no haya mapa incrustado", () => {
    render(<PropertyLocation location={LAS_CONDES} coordinates={null} />);

    const link = screen.getByRole("link", { name: /Ver en Google Maps/ });

    expect(link).toHaveAttribute(
      "href",
      "https://www.google.com/maps/search/?api=1&query=Avenida+Presidente+Riesco+4520%2C+Las+Condes%2C+Santiago%2C+Regi%C3%B3n+Metropolitana%2C+Chile",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("advierte que el enlace abre una pestaña nueva", () => {
    render(<PropertyLocation location={LAS_CONDES} coordinates={null} />);

    // El aviso forma parte del nombre accesible del enlace, no de un título
    // que solo aparezca al pasar el ratón.
    expect(
      screen.getByRole("link", {
        name: /Ver en Google Maps.*se abre en una pestaña nueva/,
      }),
    ).toBeInTheDocument();
  });
});
