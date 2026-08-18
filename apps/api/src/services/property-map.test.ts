import { afterEach, describe, expect, it, vi } from "vitest";

import {
  buildPropertyMapImageUrl,
  buildPropertyMapPath,
  buildStaticMapUrl,
  readGoogleMapsApiKey,
} from "./property-map";

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("readGoogleMapsApiKey", () => {
  it("devuelve la clave configurada", () => {
    expect(readGoogleMapsApiKey("clave-real")).toBe("clave-real");
  });

  it("trata una clave vacía o en blanco como ausente", () => {
    expect(readGoogleMapsApiKey("")).toBeNull();
    expect(readGoogleMapsApiKey("   ")).toBeNull();
    expect(readGoogleMapsApiKey(undefined)).toBeNull();
  });

  it("lee la variable de entorno cuando no recibe argumento", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "clave-de-entorno");

    expect(readGoogleMapsApiKey()).toBe("clave-de-entorno");
  });
});

describe("buildPropertyMapImageUrl", () => {
  it("devuelve la ruta del mapa cuando hay clave", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "clave-real");

    expect(buildPropertyMapImageUrl("seed-property-01")).toBe(
      "/api/properties/seed-property-01/map",
    );
  });

  it("devuelve null cuando la integración no está configurada", () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");

    expect(buildPropertyMapImageUrl("seed-property-01")).toBeNull();
  });
});

describe("buildPropertyMapPath", () => {
  it("codifica el identificador para que no rompa la ruta", () => {
    expect(buildPropertyMapPath("casa/las condes")).toBe(
      "/api/properties/casa%2Flas%20condes/map",
    );
  });
});

describe("buildStaticMapUrl", () => {
  const mapUrl = new URL(buildStaticMapUrl(LAS_CONDES, "clave-secreta"));

  it("apunta a la Maps Static API de Google", () => {
    expect(mapUrl.origin + mapUrl.pathname).toBe(
      "https://maps.googleapis.com/maps/api/staticmap",
    );
  });

  it("centra el mapa en la dirección textual, con país", () => {
    expect(mapUrl.searchParams.get("center")).toBe(
      "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana, Chile",
    );
  });

  it("sitúa el marcador en esa misma dirección", () => {
    expect(mapUrl.searchParams.get("markers")).toBe(
      "color:0x9c5b34|Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana, Chile",
    );
  });

  it("no envía coordenadas: la geocodificación la hace Google", () => {
    expect(mapUrl.searchParams.has("lat")).toBe(false);
    expect(mapUrl.searchParams.has("lng")).toBe(false);
  });

  it("incluye la clave, que por eso nunca debe llegar al navegador", () => {
    expect(mapUrl.searchParams.get("key")).toBe("clave-secreta");
  });

  it("pide el mapa en español y con encuadre de alta resolución", () => {
    expect(mapUrl.searchParams.get("language")).toBe("es");
    expect(mapUrl.searchParams.get("region")).toBe("CL");
    expect(mapUrl.searchParams.get("size")).toBe("640x360");
    expect(mapUrl.searchParams.get("scale")).toBe("2");
  });
});
