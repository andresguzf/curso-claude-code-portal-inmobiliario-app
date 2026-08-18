import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  clearCoordinatesCache,
  readGoogleMapsApiKey,
  resolvePropertyCoordinates,
} from "./property-map";

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

const GOOGLE_RESPONSE = {
  results: [{ location: { latitude: -33.4094935, longitude: -70.5847201 } }],
};

function stubFetch(payload: unknown, ok = true) {
  const fetchMock = vi.fn(async () => ({
    ok,
    status: ok ? 200 : 403,
    json: async () => payload,
  }));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

beforeEach(() => {
  clearCoordinatesCache();
  vi.stubEnv("GOOGLE_MAPS_API_KEY", "clave-de-prueba");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("readGoogleMapsApiKey", () => {
  it("devuelve la clave configurada", () => {
    expect(readGoogleMapsApiKey("clave-real")).toBe("clave-real");
  });

  it("trata una clave vacía o en blanco como ausente", () => {
    expect(readGoogleMapsApiKey("")).toBeNull();
    expect(readGoogleMapsApiKey("   ")).toBeNull();
  });

  it("lee la variable de entorno cuando no recibe argumento", () => {
    expect(readGoogleMapsApiKey()).toBe("clave-de-prueba");

    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");

    expect(readGoogleMapsApiKey()).toBeNull();
  });
});

describe("resolvePropertyCoordinates", () => {
  it("devuelve las coordenadas que resuelve Google", async () => {
    stubFetch(GOOGLE_RESPONSE);

    expect(await resolvePropertyCoordinates(LAS_CONDES)).toEqual({
      latitude: -33.4094935,
      longitude: -70.5847201,
    });
  });

  it("no consulta a Google si no hay clave configurada", async () => {
    vi.stubEnv("GOOGLE_MAPS_API_KEY", "");
    const fetchMock = stubFetch(GOOGLE_RESPONSE);

    expect(await resolvePropertyCoordinates(LAS_CONDES)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("geocodifica una misma dirección una sola vez", async () => {
    const fetchMock = stubFetch(GOOGLE_RESPONSE);

    await resolvePropertyCoordinates(LAS_CONDES);
    await resolvePropertyCoordinates(LAS_CONDES);
    await resolvePropertyCoordinates({ ...LAS_CONDES });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("distingue direcciones distintas", async () => {
    const fetchMock = stubFetch(GOOGLE_RESPONSE);

    await resolvePropertyCoordinates(LAS_CONDES);
    await resolvePropertyCoordinates({
      ...LAS_CONDES,
      address: "Avenida Apoquindo 3000",
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("no cachea los fallos: un corte de Google no deja la ficha sin mapa", async () => {
    const failingFetch = stubFetch({}, false);

    expect(await resolvePropertyCoordinates(LAS_CONDES)).toBeNull();
    expect(failingFetch).toHaveBeenCalledTimes(1);

    stubFetch(GOOGLE_RESPONSE);

    expect(await resolvePropertyCoordinates(LAS_CONDES)).not.toBeNull();
  });

  it("devuelve null cuando Google no reconoce la dirección", async () => {
    stubFetch({});

    expect(await resolvePropertyCoordinates(LAS_CONDES)).toBeNull();
  });
});
