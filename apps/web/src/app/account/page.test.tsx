import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { requireCurrentUser } = vi.hoisted(() => ({
  requireCurrentUser: vi.fn(),
}));

vi.mock("@/lib/require-user", () => ({ requireCurrentUser }));

import AccountPage from "./page";

const MARIA = {
  id: "u1",
  name: "María González",
  email: "maria@example.com",
  role: "USER",
} as const;

afterEach(() => {
  requireCurrentUser.mockReset();
});

async function renderPage(user: unknown = MARIA) {
  requireCurrentUser.mockResolvedValue(user);

  return render(await AccountPage());
}

describe("AccountPage", () => {
  it("exige sesión antes de pintar, recordando el destino", async () => {
    await renderPage();

    expect(requireCurrentUser).toHaveBeenCalledWith("/account");
  });

  it("muestra la información básica de la cuenta", async () => {
    await renderPage();

    expect(screen.getByText("María González")).toBeVisible();
    expect(screen.getByText("maria@example.com")).toBeVisible();
    expect(screen.getByText("Usuario")).toBeVisible();
  });

  it("traduce el rol de administración", async () => {
    await renderPage({ ...MARIA, role: "ADMIN" });

    expect(screen.getByText("Administración")).toBeVisible();
  });

  it("prepara las secciones de propiedades interesadas y consultadas", async () => {
    await renderPage();

    for (const title of [
      "Propiedades interesadas",
      "Propiedades consultadas",
    ]) {
      expect(screen.getByRole("region", { name: title })).toBeInTheDocument();
    }
  });

  it("explica el vacío en términos de quien lee, no del desarrollo", async () => {
    await renderPage();

    expect(
      screen.getByText(/Todavía no has guardado ninguna propiedad/),
    ).toBeVisible();
    expect(
      screen.getByText(/Todavía no has enviado ninguna consulta/),
    ).toBeVisible();
  });

  it("ofrece una salida desde cada sección vacía", async () => {
    await renderPage();

    const links = screen.getAllByRole("link", { name: "Explorar propiedades" });

    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/properties");
  });

  it("no expone el identificador interno de la cuenta", async () => {
    const { container } = await renderPage();

    expect(container.textContent).not.toContain("u1");
  });
});
