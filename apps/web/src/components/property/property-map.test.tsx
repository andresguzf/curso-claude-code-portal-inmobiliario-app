import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { importLibrary, setOptions, MapConstructor, MarkerConstructor } =
  vi.hoisted(() => ({
    importLibrary: vi.fn(),
    setOptions: vi.fn(),
    MapConstructor: vi.fn(),
    MarkerConstructor: vi.fn(),
  }));

vi.mock("@googlemaps/js-api-loader", () => ({ importLibrary, setOptions }));

import { resetGoogleMapsConfiguration } from "@/hooks/use-google-map";

import { PropertyMap } from "./property-map";

const LAS_CONDES = { latitude: -33.4094935, longitude: -70.5847201 };

beforeEach(() => {
  resetGoogleMapsConfiguration();
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "clave-publica");
  importLibrary.mockImplementation(async (library: string) =>
    library === "maps"
      ? { Map: MapConstructor }
      : { AdvancedMarkerElement: MarkerConstructor },
  );
});

afterEach(() => {
  vi.unstubAllEnvs();
  importLibrary.mockReset();
  setOptions.mockReset();
  MapConstructor.mockReset();
  MarkerConstructor.mockReset();
});

describe("PropertyMap", () => {
  it("centra el mapa y el marcador en las coordenadas recibidas", async () => {
    render(<PropertyMap coordinates={LAS_CONDES} />);

    await waitFor(() => expect(MapConstructor).toHaveBeenCalledTimes(1));

    const [, mapOptions] = MapConstructor.mock.calls[0] as [
      HTMLElement,
      { center: { lat: number; lng: number } },
    ];

    expect(mapOptions.center).toEqual({ lat: -33.4094935, lng: -70.5847201 });

    const [markerOptions] = MarkerConstructor.mock.calls[0] as [
      { position: { lat: number; lng: number } },
    ];

    expect(markerOptions.position).toEqual({
      lat: -33.4094935,
      lng: -70.5847201,
    });
  });

  it("avisa mientras el mapa está cargando", () => {
    render(<PropertyMap coordinates={LAS_CONDES} />);

    expect(screen.getByText("Cargando el mapa…")).toBeInTheDocument();
  });

  it("retira el aviso cuando el mapa ya está dibujado", async () => {
    render(<PropertyMap coordinates={LAS_CONDES} />);

    await waitFor(() =>
      expect(screen.queryByText("Cargando el mapa…")).not.toBeInTheDocument(),
    );
  });

  it("configura el mapa en español y para Chile", async () => {
    render(<PropertyMap coordinates={LAS_CONDES} />);

    await waitFor(() => expect(MapConstructor).toHaveBeenCalled());

    expect(setOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        key: "clave-publica",
        language: "es",
        region: "CL",
      }),
    );
  });

  it("no llama a Google si la clave pública no está configurada", async () => {
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY", "");

    render(<PropertyMap coordinates={LAS_CONDES} />);

    expect(await screen.findByText("No pudimos cargar el mapa.")).toBeVisible();
    expect(importLibrary).not.toHaveBeenCalled();
  });

  it("avisa cuando Google falla, en lugar de dejar un recuadro vacío", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    importLibrary.mockRejectedValue(new Error("red caída"));

    render(<PropertyMap coordinates={LAS_CONDES} />);

    expect(await screen.findByText("No pudimos cargar el mapa.")).toBeVisible();
  });
});
