import { describe, expect, it } from "vitest";

import { buildGoogleMapsSearchUrl } from "./google-maps";

describe("buildGoogleMapsSearchUrl", () => {
  const searchUrl = new URL(
    buildGoogleMapsSearchUrl({
      address: "Avenida Presidente Riesco 4520",
      commune: "Las Condes",
      city: "Santiago",
      region: "Región Metropolitana",
    }),
  );

  it("apunta a la búsqueda pública de Google Maps", () => {
    expect(searchUrl.origin + searchUrl.pathname).toBe(
      "https://www.google.com/maps/search/",
    );
  });

  it("busca por la dirección completa, con país", () => {
    expect(searchUrl.searchParams.get("query")).toBe(
      "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana, Chile",
    );
  });

  it("no incluye ninguna clave de API", () => {
    expect(searchUrl.searchParams.has("key")).toBe(false);
  });
});
