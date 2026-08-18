import { describe, expect, it } from "vitest";

import { buildGeocodingUrl, readCoordinates } from "./geocoding";

const LAS_CONDES = {
  address: "Avenida Presidente Riesco 4520",
  commune: "Las Condes",
  city: "Santiago",
  region: "Región Metropolitana",
};

describe("buildGeocodingUrl", () => {
  const geocodingUrl = new URL(buildGeocodingUrl(LAS_CONDES, "clave-secreta"));

  it("usa la versión 4, que no exige cuenta de facturación", () => {
    expect(geocodingUrl.origin).toBe("https://geocode.googleapis.com");
    expect(geocodingUrl.pathname).toContain("/v4beta/geocode/address/");
  });

  it("consulta por la dirección completa, con país", () => {
    expect(decodeURIComponent(geocodingUrl.pathname)).toContain(
      "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana, Chile",
    );
  });

  it("incluye la clave, que por eso nunca debe llegar al navegador", () => {
    expect(geocodingUrl.searchParams.get("key")).toBe("clave-secreta");
  });

  it("codifica los caracteres que romperían la ruta", () => {
    const url = buildGeocodingUrl(
      { ...LAS_CONDES, address: "Camino El Alba 1/2 #3" },
      "clave",
    );

    expect(url).not.toContain("#");
    expect(new URL(url).pathname).not.toContain(" ");
  });
});

describe("readCoordinates", () => {
  it("extrae latitud y longitud del primer resultado", () => {
    expect(
      readCoordinates({
        results: [
          {
            location: { latitude: -33.4094935, longitude: -70.5847201 },
            granularity: "RANGE_INTERPOLATED",
          },
        ],
      }),
    ).toEqual({ latitude: -33.4094935, longitude: -70.5847201 });
  });

  it("devuelve null ante el cuerpo vacío de una dirección desconocida", () => {
    // Google responde 200 con `{}` cuando no reconoce la dirección.
    expect(readCoordinates({})).toBeNull();
    expect(readCoordinates({ results: [] })).toBeNull();
  });

  it("devuelve null ante una respuesta con forma inesperada", () => {
    expect(readCoordinates(null)).toBeNull();
    expect(readCoordinates("no es JSON de Google")).toBeNull();
    expect(readCoordinates({ results: [{}] })).toBeNull();
    expect(readCoordinates({ results: [{ location: {} }] })).toBeNull();
    expect(
      readCoordinates({ results: [{ location: { latitude: "-33.4" } }] }),
    ).toBeNull();
  });
});
