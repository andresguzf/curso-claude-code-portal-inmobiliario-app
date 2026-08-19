import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { requireCurrentUser, fetchFavorites, fetchUserInquiries } = vi.hoisted(
  () => ({
    requireCurrentUser: vi.fn(),
    fetchFavorites: vi.fn(),
    fetchUserInquiries: vi.fn(),
  }),
);

vi.mock("@/lib/require-user", () => ({ requireCurrentUser }));
vi.mock("@/lib/api-client", () => ({
  fetchFavorites,
  fetchUserInquiries,
  hideInquiry: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({ toString: () => "portal_session=testigo" }),
}));
// Las tarjetas guardadas llevan el botón de favorito, que usa el enrutador.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import AccountPage from "./page";

const MARIA = {
  id: "u1",
  name: "María González",
  email: "maria@example.com",
  role: "USER",
} as const;

const EMPTY_LIST = { data: [], total: 0 };
const EMPTY_PAGE = { data: [], total: 0, page: 1, pageSize: 6 };

afterEach(() => {
  requireCurrentUser.mockReset();
  fetchFavorites.mockReset();
  fetchUserInquiries.mockReset();
});

async function renderPage(
  user: unknown = MARIA,
  lists: {
    favorites?: unknown;
    inquiries?: unknown;
    searchParams?: Record<string, string>;
  } = {},
) {
  requireCurrentUser.mockResolvedValue(user);
  fetchFavorites.mockResolvedValue(lists.favorites ?? EMPTY_LIST);
  fetchUserInquiries.mockResolvedValue(lists.inquiries ?? EMPTY_PAGE);

  return render(
    await AccountPage({
      params: Promise.resolve({}),
      searchParams: Promise.resolve(lists.searchParams ?? {}),
    }),
  );
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

    for (const title of ["Propiedades interesadas", "Mis consultas"]) {
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

  it("ofrece una salida desde la sección vacía de guardadas", async () => {
    await renderPage();

    expect(
      screen.getByRole("link", { name: "Explorar propiedades" }),
    ).toHaveAttribute("href", "/properties");
  });

  it("no expone el identificador interno de la cuenta", async () => {
    const { container } = await renderPage();

    expect(container.textContent).not.toContain("u1");
  });
});

describe("AccountPage — listas", () => {
  const property = {
    id: "seed-property-03",
    title: "Departamento en Providencia",
    operationType: "RENT" as const,
    propertyType: "APARTMENT" as const,
    price: 1200,
    currency: "USD" as const,
    commune: "Providencia",
    city: "Santiago",
    region: "Región Metropolitana",
    bedrooms: 2,
    bathrooms: 1,
    usableAreaSquareMeters: 62,
    isFeatured: false,
    primaryImage: null,
    createdAt: "2026-01-15T10:30:00.000Z",
  };

  it("lista las propiedades guardadas cuando las hay", async () => {
    await renderPage(MARIA, { favorites: { data: [property], total: 1 } });

    expect(
      screen.getByRole("region", { name: "Propiedades interesadas" }),
    ).toHaveTextContent("Departamento en Providencia");
    expect(
      screen.queryByText(/Todavía no has guardado ninguna propiedad/),
    ).toBeNull();
  });

  it("lista las consultas como registros, con su mensaje", async () => {
    await renderPage(MARIA, {
      inquiries: {
        data: [
          {
            id: "c1",
            message: "¿Acepta crédito hipotecario?",
            createdAt: "2026-02-01T10:00:00.000Z",
            property: { id: "p1", title: "Casa en Las Condes", imageUrl: null },
          },
        ],
        total: 1,
        page: 1,
        pageSize: 6,
      },
    });

    const seccion = screen.getByRole("region", { name: "Mis consultas" });

    expect(seccion).toHaveTextContent("Casa en Las Condes");
    expect(seccion).toHaveTextContent("¿Acepta crédito hipotecario?");
  });

  it("pasa a la API la búsqueda y la página de la URL", async () => {
    await renderPage(MARIA, {
      searchParams: { search: " piscina ", page: "3" },
    });

    expect(fetchUserInquiries).toHaveBeenCalledWith(
      { search: "piscina", page: 3 },
      expect.any(String),
    );
  });

  it("trata una página inválida como la primera", async () => {
    await renderPage(MARIA, { searchParams: { page: "abc" } });

    expect(fetchUserInquiries).toHaveBeenCalledWith(
      { search: "", page: 1 },
      expect.any(String),
    );
  });

  it("una lista caída no tumba la otra ni la página", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    requireCurrentUser.mockResolvedValue(MARIA);
    fetchFavorites.mockRejectedValue(new Error("API caída"));
    fetchUserInquiries.mockResolvedValue(EMPTY_PAGE);

    render(
      await AccountPage({
        params: Promise.resolve({}),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(
      screen.getByText(/Todavía no has guardado ninguna propiedad/),
    ).toBeVisible();
    expect(
      screen.getByRole("region", { name: "Mis consultas" }),
    ).toBeInTheDocument();
  });
});
