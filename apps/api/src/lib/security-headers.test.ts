import { describe, expect, it } from "vitest";

import { buildApiSecurityHeaders } from "@/lib/security-headers";

/** Busca una cabecera por nombre, para no depender del orden de la lista. */
function leer(
  cabeceras: ReturnType<typeof buildApiSecurityHeaders>,
  clave: string,
) {
  return cabeceras.find((cabecera) => cabecera.key === clave)?.value;
}

describe("buildApiSecurityHeaders", () => {
  it("no permite que la API cargue ni ejecute nada", () => {
    const politica = leer(buildApiSecurityHeaders(), "Content-Security-Policy");

    // Solo devuelve JSON: no hay ningún recurso legítimo que traer.
    expect(politica).toContain("default-src 'none'");
  });

  it("prohíbe que la API se muestre dentro de un marco", () => {
    const cabeceras = buildApiSecurityHeaders();

    expect(leer(cabeceras, "Content-Security-Policy")).toContain(
      "frame-ancestors 'none'",
    );
    // La misma prohibición para navegadores que no aplican `frame-ancestors`.
    expect(leer(cabeceras, "X-Frame-Options")).toBe("DENY");
  });

  it("impide que una respuesta se interprete como algo que no declara", () => {
    expect(leer(buildApiSecurityHeaders(), "X-Content-Type-Options")).toBe(
      "nosniff",
    );
  });

  it("exige https solo en producción", () => {
    // En local se sirve por http: anunciar que el sitio es solo https dejaría
    // `localhost` inaccesible en ese navegador durante el año siguiente.
    expect(
      leer(buildApiSecurityHeaders(true), "Strict-Transport-Security"),
    ).toBeUndefined();
    expect(
      leer(buildApiSecurityHeaders(false), "Strict-Transport-Security"),
    ).toContain("max-age=31536000");
  });
});
