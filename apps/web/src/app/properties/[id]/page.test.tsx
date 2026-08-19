import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { buildPropertyDetail } from "@/test-support/property-fixtures";

import PropertyDetailPage from "./page";

const { fetchPublicPropertyById, notFound } = vi.hoisted(() => ({
  fetchPublicPropertyById: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("@/lib/api-client", () => ({ fetchPublicPropertyById }));
vi.mock("next/navigation", () => ({ notFound }));

// El catálogo pide los favoritos junto con las propiedades; sin sesión
// no hay ninguno y las tarjetas no ofrecen el botón.
vi.mock("@/lib/favorites", () => ({
  getFavoritePropertyIds: async () => undefined,
}));

afterEach(() => {
  fetchPublicPropertyById.mockReset();
  notFound.mockClear();
  vi.restoreAllMocks();
});

async function renderPage(id = "seed-property-01") {
  return render(
    await PropertyDetailPage({
      params: Promise.resolve({ id }),
      searchParams: Promise.resolve({}),
    }),
  );
}

describe("PropertyDetailPage — información completa", () => {
  it("muestra título, precio, operación y tipo", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage();

    expect(
      screen.getByRole("heading", { level: 1, name: "Casa en Las Condes" }),
    ).toBeVisible();
    expect(screen.getByText(/890\.000/)).toBeVisible();
    expect(screen.getByText(/Venta · Casa/)).toBeVisible();
  });

  it("muestra la descripción completa", async () => {
    fetchPublicPropertyById.mockResolvedValue(
      buildPropertyDetail({ description: "Descripción muy detallada." }),
    );

    await renderPage();

    expect(screen.getByText("Descripción muy detallada.")).toBeVisible();
  });

  it("muestra las características numéricas de la especificación", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    const section = await renderPage().then(() =>
      screen.getByRole("region", { name: "Características" }),
    );

    for (const label of [
      "Superficie útil",
      "Superficie total",
      "Dormitorios",
      "Baños",
      "Estacionamientos",
      "Antigüedad",
    ]) {
      expect(within(section).getByText(label)).toBeVisible();
    }

    expect(within(section).getByText("180 m²")).toBeVisible();
    expect(within(section).getByText("420 m²")).toBeVisible();
    expect(within(section).getByText("12 años")).toBeVisible();
  });

  it("muestra las comodidades como lista", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage();

    const section = screen.getByRole("region", { name: "Comodidades" });

    expect(within(section).getAllByRole("listitem")).toHaveLength(2);
    expect(within(section).getByText("Piscina")).toBeVisible();
  });

  it("muestra la ubicación completa", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage();

    const section = screen.getByRole("region", { name: "Ubicación" });

    expect(
      within(section).getByText(
        "Avenida Presidente Riesco 4520, Las Condes, Santiago, Región Metropolitana",
      ),
    ).toBeVisible();
  });

  it("muestra la galería, con la fotografía situada en el conjunto", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage();

    expect(
      screen.getByRole("img", {
        name: "Fotografía 1 de 1 de Casa en Las Condes",
      }),
    ).toBeVisible();
  });

  it("enlaza de vuelta al catálogo", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage();

    expect(
      screen.getByRole("link", { name: "← Volver al catálogo" }),
    ).toHaveAttribute("href", "/properties");
  });

  it("consume la API REST con el identificador de la ruta", async () => {
    fetchPublicPropertyById.mockResolvedValue(buildPropertyDetail());

    await renderPage("seed-property-04");

    expect(fetchPublicPropertyById).toHaveBeenCalledWith("seed-property-04");
  });
});

describe("PropertyDetailPage — datos ausentes", () => {
  it("omite las características que la propiedad no declara", async () => {
    fetchPublicPropertyById.mockResolvedValue(
      buildPropertyDetail({
        propertyType: "LAND",
        bedrooms: null,
        bathrooms: null,
        parkingSpaces: null,
        usableAreaSquareMeters: null,
        ageYears: null,
      }),
    );

    await renderPage();

    const section = screen.getByRole("region", { name: "Características" });

    expect(within(section).queryByText("Dormitorios")).not.toBeInTheDocument();
    expect(within(section).queryByText("Antigüedad")).not.toBeInTheDocument();
    expect(within(section).getByText("Superficie total")).toBeVisible();
  });

  it("no renderiza comodidades cuando la propiedad no tiene ninguna", async () => {
    fetchPublicPropertyById.mockResolvedValue(
      buildPropertyDetail({ features: [] }),
    );

    await renderPage();

    expect(
      screen.queryByRole("region", { name: "Comodidades" }),
    ).not.toBeInTheDocument();
  });

  it("avisa cuando la propiedad no tiene fotografías, sin dejar un hueco", async () => {
    fetchPublicPropertyById.mockResolvedValue(
      buildPropertyDetail({ primaryImage: null, images: [] }),
    );

    await renderPage();

    // El mapa sigue presente: lo que falta son las fotografías.
    expect(
      screen.queryByRole("img", { name: /^Fotografía/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Esta propiedad todavía no tiene fotografías"),
    ).toBeVisible();
    expect(
      screen.getByRole("heading", { level: 1, name: "Casa en Las Condes" }),
    ).toBeVisible();
  });
});

describe("PropertyDetailPage — propiedad no disponible", () => {
  it("responde 404 cuando la propiedad no existe o está despublicada", async () => {
    fetchPublicPropertyById.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalledOnce();
  });

  it("no confunde un fallo de la API con una propiedad inexistente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchPublicPropertyById.mockRejectedValue(new Error("backend caído"));

    await renderPage();

    expect(notFound).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("No pudimos cargar la propiedad")).toBeVisible();
  });

  it("ofrece reintentar la misma propiedad tras un fallo", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchPublicPropertyById.mockRejectedValue(new Error("backend caído"));

    await renderPage("seed-property-09");

    expect(screen.getByRole("link", { name: "Reintentar" })).toHaveAttribute(
      "href",
      "/properties/seed-property-09",
    );
  });

  it("registra el fallo en el servidor", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    fetchPublicPropertyById.mockRejectedValue(new Error("backend caído"));

    await renderPage();

    expect(consoleError).toHaveBeenCalled();
  });
});
