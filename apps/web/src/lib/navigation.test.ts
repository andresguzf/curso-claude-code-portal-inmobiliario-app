import { describe, expect, it } from "vitest";

import {
  LOGIN_NAVIGATION_ITEM,
  PUBLIC_NAVIGATION_ITEMS,
  isNavigationItemActive,
} from "./navigation";

describe("PUBLIC_NAVIGATION_ITEMS", () => {
  it("contiene la navegación pública definida en la especificación", () => {
    expect(PUBLIC_NAVIGATION_ITEMS.map((item) => item.label)).toEqual([
      "Inicio",
      "Propiedades",
      "Comprar",
      "Arrendar",
    ]);

    expect(LOGIN_NAVIGATION_ITEM.label).toBe("Ingresar");
  });
});

describe("isNavigationItemActive", () => {
  it("marca Inicio como activo solo en la raíz", () => {
    expect(isNavigationItemActive("/", "/", new URLSearchParams())).toBe(true);
    expect(
      isNavigationItemActive("/", "/properties", new URLSearchParams()),
    ).toBe(false);
  });

  it("distingue Propiedades, Comprar y Arrendar por el parámetro operation", () => {
    const searchParams = new URLSearchParams("operation=SALE");

    expect(
      isNavigationItemActive(
        "/properties?operation=SALE",
        "/properties",
        searchParams,
      ),
    ).toBe(true);
    expect(
      isNavigationItemActive(
        "/properties?operation=RENT",
        "/properties",
        searchParams,
      ),
    ).toBe(false);
    expect(
      isNavigationItemActive("/properties", "/properties", searchParams),
    ).toBe(false);
  });

  it("mantiene Propiedades activo con otros parámetros de consulta", () => {
    expect(
      isNavigationItemActive(
        "/properties",
        "/properties",
        new URLSearchParams("search=providencia"),
      ),
    ).toBe(true);
  });
});
