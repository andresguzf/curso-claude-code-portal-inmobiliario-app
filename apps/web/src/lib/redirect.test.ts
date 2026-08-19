import { describe, expect, it } from "vitest";

import { sanitizeRedirectPath } from "./redirect";

describe("sanitizeRedirectPath", () => {
  it("conserva una ruta de este sitio", () => {
    expect(sanitizeRedirectPath("/properties?operation=SALE")).toBe(
      "/properties?operation=SALE",
    );
  });

  it("rechaza un destino en otro dominio", () => {
    // Justo tras autenticarse es cuando más confianza se tiene en lo que se
    // ve: un salto a otro dominio ahí es especialmente peligroso.
    for (const hostile of [
      "https://sitio-falso.cl",
      "//sitio-falso.cl",
      "/\\sitio-falso.cl",
      "javascript:alert(1)",
    ]) {
      expect(sanitizeRedirectPath(hostile)).toBe("/");
    }
  });

  it("cae en la portada si no hay destino", () => {
    expect(sanitizeRedirectPath(undefined)).toBe("/");
    expect(sanitizeRedirectPath(null)).toBe("/");
    expect(sanitizeRedirectPath("")).toBe("/");
  });
});
