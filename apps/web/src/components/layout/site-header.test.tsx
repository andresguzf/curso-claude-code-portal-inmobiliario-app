import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SiteHeader } from "./site-header";

const mocks = vi.hoisted(() => ({
  pathname: "/",
  searchParams: new URLSearchParams(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useSearchParams: () => mocks.searchParams,
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
}));

afterEach(() => {
  mocks.pathname = "/";
  mocks.searchParams = new URLSearchParams();
});

describe("SiteHeader — marca", () => {
  it("muestra el logo junto al nombre, en un solo enlace al inicio", () => {
    const { container } = render(<SiteHeader currentUser={null} />);

    const brand = screen.getByRole("link", { name: "Portal Inmobiliario" });

    expect(brand).toHaveAttribute("href", "/");
    expect(container.querySelector("header svg")).toBeInTheDocument();
  });

  it("oculta el logo a las tecnologías de asistencia, que ya leen el nombre", () => {
    const { container } = render(<SiteHeader currentUser={null} />);

    // El primer svg del header es el logo; el segundo, el ícono del menú.
    const logo = container.querySelector("header a svg");

    expect(logo).toHaveAttribute("aria-hidden", "true");
    // El nombre accesible del enlace viene solo del texto, sin duplicarse.
    expect(
      screen.getByRole("link", { name: "Portal Inmobiliario" }),
    ).toBeInTheDocument();
  });

  it("evita que la traducción automática altere el nombre de marca", () => {
    render(<SiteHeader currentUser={null} />);

    expect(screen.getByText("Portal Inmobiliario")).toHaveAttribute(
      "translate",
      "no",
    );
  });
});

describe("SiteHeader", () => {
  it("muestra la navegación pública completa", () => {
    render(<SiteHeader currentUser={null} />);

    const navigation = screen.getByRole("navigation", { name: "Principal" });

    for (const label of [
      "Inicio",
      "Propiedades",
      "Comprar",
      "Arrendar",
      "Ingresar",
    ]) {
      expect(
        within(navigation).getByRole("link", { name: label }),
      ).toBeVisible();
    }
  });

  it("marca el elemento correspondiente a la ubicación actual", () => {
    mocks.pathname = "/properties";
    mocks.searchParams = new URLSearchParams("operation=RENT");

    render(<SiteHeader currentUser={null} />);

    const navigation = screen.getByRole("navigation", { name: "Principal" });

    expect(
      within(navigation).getByRole("link", { name: "Arrendar" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      within(navigation).getByRole("link", { name: "Comprar" }),
    ).not.toHaveAttribute("aria-current");
  });

  it("abre y cierra el menú móvil desde el botón", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentUser={null} />);

    const toggleButton = screen.getByRole("button", { name: "Abrir menú" });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("navigation", { name: "Principal móvil" }),
    ).not.toBeInTheDocument();

    await user.click(toggleButton);

    expect(screen.getByRole("button", { name: "Cerrar menú" })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    expect(
      screen.getByRole("navigation", { name: "Principal móvil" }),
    ).toBeInTheDocument();
  });

  it("cierra el menú móvil al navegar a un enlace", async () => {
    const user = userEvent.setup();
    render(<SiteHeader currentUser={null} />);

    await user.click(screen.getByRole("button", { name: "Abrir menú" }));

    const mobileNavigation = screen.getByRole("navigation", {
      name: "Principal móvil",
    });
    await user.click(
      within(mobileNavigation).getByRole("link", { name: "Comprar" }),
    );

    expect(
      screen.queryByRole("navigation", { name: "Principal móvil" }),
    ).not.toBeInTheDocument();
  });
});
