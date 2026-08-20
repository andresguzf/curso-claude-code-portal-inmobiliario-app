import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ pathname: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => mocks.pathname,
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn(), push: vi.fn() }),
}));
vi.mock("@/lib/api-client", () => ({ logOut: vi.fn() }));

import { AdminShell } from "./admin-shell";

function renderShell() {
  return render(
    <AdminShell adminName="Administradora del portal" theme="light">
      <p>Contenido del panel</p>
    </AdminShell>,
  );
}

afterEach(() => {
  mocks.pathname = "/admin";
});

describe("AdminShell", () => {
  it("presenta las secciones de administración en su propia barra", () => {
    renderShell();

    const barra = screen.getByRole("navigation", {
      name: "Secciones de administración",
    });

    expect(within(barra).getByRole("link", { name: "Resumen" })).toBeVisible();
    expect(
      within(barra).getByRole("link", { name: "Propiedades" }),
    ).toBeVisible();
    expect(
      within(barra).getByRole("link", { name: "Mi perfil" }),
    ).toBeVisible();
  });

  it("no arrastra la navegación del portal ni nada personal", () => {
    // El panel es otra raíz: quien administra no tiene favoritos.
    renderShell();

    for (const ausente of [/guardada/i, /favorito/i, /mi cuenta/i]) {
      expect(screen.queryByRole("link", { name: ausente })).toBeNull();
    }

    // «Propiedades» sí existe, pero es la sección del panel: lleva a
    // administrarlas, no al catálogo público.
    expect(screen.getByRole("link", { name: "Propiedades" })).toHaveAttribute(
      "href",
      "/admin/properties",
    );
  });

  it("marca la sección en la que se está", () => {
    mocks.pathname = "/admin/profile";

    renderShell();

    expect(screen.getByRole("link", { name: "Mi perfil" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Resumen" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("no marca «Resumen» estando en una subsección", () => {
    // `/admin` es prefijo de todo: sin la excepción quedarían dos activas.
    mocks.pathname = "/admin/profile";

    renderShell();

    expect(screen.getByRole("link", { name: "Resumen" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("contrae y expande la barra", async () => {
    const user = userEvent.setup();

    renderShell();

    const boton = screen.getByRole("button", { name: "Contraer el menú" });

    expect(boton).toHaveAttribute("aria-expanded", "true");

    await user.click(boton);

    expect(
      screen.getByRole("button", { name: "Expandir el menú" }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("muestra quién administra y ofrece salir", () => {
    renderShell();

    expect(screen.getByText("Administradora del portal")).toBeVisible();
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
  });

  it("deja una salida al portal público", () => {
    renderShell();

    expect(screen.getByRole("link", { name: "Ver el portal" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  it("pinta el contenido que recibe", () => {
    renderShell();

    expect(screen.getByText("Contenido del panel")).toBeVisible();
  });
});
