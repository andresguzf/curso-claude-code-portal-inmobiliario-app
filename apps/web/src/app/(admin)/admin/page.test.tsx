import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { requireAdminUser, fetchAdminOverview } = vi.hoisted(() => ({
  requireAdminUser: vi.fn(),
  fetchAdminOverview: vi.fn(),
}));

vi.mock("@/lib/require-user", () => ({ requireAdminUser }));
vi.mock("@/lib/api-client", () => ({ fetchAdminOverview }));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "portal_session=testigo" }),
}));

import AdminPage from "./page";

const ADMIN = {
  id: "u1",
  name: "Administradora del portal",
  email: "admin@portal.cl",
  role: "ADMIN",
} as const;

const OVERVIEW = {
  totalProperties: 12,
  publishedProperties: 10,
  propertiesForSale: 7,
  propertiesForRent: 5,
  users: 5,
  inquiries: 8,
};

afterEach(() => {
  requireAdminUser.mockReset();
  fetchAdminOverview.mockReset();
});

async function renderPage(overview: unknown = OVERVIEW) {
  requireAdminUser.mockResolvedValue(ADMIN);
  fetchAdminOverview.mockResolvedValue(overview);

  return render(await AdminPage());
}

function indicador(label: string) {
  return screen.getByText(label).closest("div") as HTMLElement;
}

describe("AdminPage", () => {
  it("exige rol ADMIN antes de pintar nada", async () => {
    await renderPage();

    expect(requireAdminUser).toHaveBeenCalledWith("/admin");
  });

  it("muestra los seis indicadores que pide la especificación", async () => {
    await renderPage();

    expect(within(indicador("Propiedades")).getByText("12")).toBeVisible();
    expect(within(indicador("Publicadas")).getByText("10")).toBeVisible();
    expect(within(indicador("En venta")).getByText("7")).toBeVisible();
    expect(within(indicador("En arriendo")).getByText("5")).toBeVisible();
    expect(within(indicador("Usuarios")).getByText("5")).toBeVisible();
    expect(within(indicador("Consultas")).getByText("8")).toBeVisible();
  });

  it("aclara que el total incluye borradores", async () => {
    // Sin la aclaración, «Propiedades 12» y «Publicadas 10» se contradicen.
    await renderPage();

    expect(screen.getByText("Incluye borradores")).toBeVisible();
  });

  it("saluda a quien administra", async () => {
    await renderPage();

    expect(screen.getByText(/Administradora del portal/)).toBeVisible();
  });

  it("muestra un cero sin confundirlo con un dato ausente", async () => {
    await renderPage({ ...OVERVIEW, inquiries: 0 });

    expect(within(indicador("Consultas")).getByText("0")).toBeVisible();
  });

  it("dice que no pudo cargarlos en vez de mostrar el panel vacío", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireAdminUser.mockResolvedValue(ADMIN);
    fetchAdminOverview.mockRejectedValue(new Error("API caída"));

    render(await AdminPage());

    expect(screen.getByText(/No pudimos cargar los indicadores/)).toBeVisible();
    expect(screen.queryByText("Propiedades")).toBeNull();
  });
});
