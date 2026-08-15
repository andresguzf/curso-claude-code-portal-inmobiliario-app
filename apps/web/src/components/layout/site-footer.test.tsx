import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteFooter } from "./site-footer";

describe("SiteFooter", () => {
  it("expone la navegación pública dentro de un elemento semántico", () => {
    render(<SiteFooter />);

    const navigation = screen.getByRole("navigation", { name: "Navegación" });

    for (const label of ["Inicio", "Propiedades", "Comprar", "Arrendar"]) {
      expect(within(navigation).getByRole("link", { name: label })).toBeVisible();
    }
  });

  it("muestra el aviso de derechos con el año actual", () => {
    render(<SiteFooter />);

    expect(
      screen.getByText(
        new RegExp(`©\\s*${new Date().getFullYear()}\\s*Portal Inmobiliario`),
      ),
    ).toBeVisible();
  });
});
