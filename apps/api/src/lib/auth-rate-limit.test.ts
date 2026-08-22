import { describe, expect, it } from "vitest";

import { buildLoginKey } from "@/lib/auth-rate-limit";

describe("buildLoginKey", () => {
  it("separa el contador por cuenta dentro de un mismo origen", () => {
    const deMaria = buildLoginKey("203.0.113.1", { email: "maria@example.com" });
    const deAna = buildLoginKey("203.0.113.1", { email: "ana@example.com" });

    // Es la razón de ser del cambio: que María se equivoque no puede dejar
    // fuera a Ana, que sale por la misma IP de la oficina.
    expect(deMaria).not.toBe(deAna);
  });

  it("separa el contador por origen para una misma cuenta", () => {
    expect(buildLoginKey("203.0.113.1", { email: "maria@example.com" })).not.toBe(
      buildLoginKey("198.51.100.9", { email: "maria@example.com" }),
    );
  });

  it("ignora mayúsculas y espacios en el correo", () => {
    // Sin normalizar, alternar mayúsculas estrenaría ventana en cada intento.
    expect(buildLoginKey("1.1.1.1", { email: "  Maria@Example.COM " })).toBe(
      buildLoginKey("1.1.1.1", { email: "maria@example.com" }),
    );
  });

  it("agrupa aparte lo que no trae un correo legible", () => {
    const esperado = "1.1.1.1|sin-cuenta";

    // Esas peticiones acaban en 400 igualmente; darle a cada una su propio
    // contador sería regalar intentos a quien envía basura.
    expect(buildLoginKey("1.1.1.1", null)).toBe(esperado);
    expect(buildLoginKey("1.1.1.1", {})).toBe(esperado);
    expect(buildLoginKey("1.1.1.1", { email: 42 })).toBe(esperado);
    expect(buildLoginKey("1.1.1.1", { email: "   " })).toBe(esperado);
  });
});
