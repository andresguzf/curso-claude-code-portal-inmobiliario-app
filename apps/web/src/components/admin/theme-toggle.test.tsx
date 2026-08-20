import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "./theme-toggle";

beforeEach(() => {
  document.documentElement.removeAttribute("data-theme");
  document.cookie = "admin_theme=; path=/; max-age=0";
});

afterEach(() => {
  document.documentElement.removeAttribute("data-theme");
});

describe("ThemeToggle", () => {
  it("anuncia a qué tema cambia, no en cuál está", () => {
    // Un botón dice lo que hace al pulsarlo.
    render(<ThemeToggle initialTheme="light" />);

    expect(
      screen.getByRole("button", { name: "Cambiar a tema oscuro" }),
    ).toBeInTheDocument();
  });

  it("invierte el anuncio estando en oscuro", () => {
    render(<ThemeToggle initialTheme="dark" />);

    expect(
      screen.getByRole("button", { name: "Cambiar a tema claro" }),
    ).toBeInTheDocument();
  });

  it("cambia el tema en el acto, sin esperar al servidor", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle initialTheme="light" />);
    await user.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("recuerda la preferencia en una cookie", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle initialTheme="light" />);
    await user.click(screen.getByRole("button"));

    // Sin esto, la próxima carga empezaría en claro y saltaría a oscuro.
    expect(document.cookie).toContain("admin_theme=dark");
  });

  it("vuelve al tema anterior al pulsar de nuevo", async () => {
    const user = userEvent.setup();

    render(<ThemeToggle initialTheme="light" />);
    await user.click(screen.getByRole("button"));
    await user.click(screen.getByRole("button"));

    expect(document.documentElement.dataset.theme).toBe("light");
    expect(document.cookie).toContain("admin_theme=light");
  });
});
