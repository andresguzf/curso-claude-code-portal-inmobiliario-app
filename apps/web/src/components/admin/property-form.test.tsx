import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminPropertyDto } from "@portal/contracts";

const { createAdminProperty, updateAdminProperty, push, refresh } = vi.hoisted(
  () => ({
    createAdminProperty: vi.fn(),
    updateAdminProperty: vi.fn(),
    push: vi.fn(),
    refresh: vi.fn(),
  }),
);

vi.mock("@/lib/api-client", () => ({
  createAdminProperty,
  updateAdminProperty,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, replace: vi.fn() }),
}));

import { PropertyForm } from "./property-form";
import { readFlash, resetFlashForTests } from "@/lib/flash";

const FEATURES = [
  { id: "f1", name: "Piscina", slug: "piscina" },
  { id: "f2", name: "Estacionamiento", slug: "estacionamiento" },
];

const PROPERTY: AdminPropertyDto = {
  id: "prop-1",
  title: "Casa en Ñuñoa",
  description: "Una casa con patio.",
  operationType: "RENT",
  propertyType: "APARTMENT",
  price: 1200,
  currency: "USD",
  usableAreaSquareMeters: 85,
  totalAreaSquareMeters: null,
  bedrooms: 3,
  bathrooms: null,
  parkingSpaces: null,
  ageYears: 0,
  address: "Av. Siempre Viva 742",
  commune: "Ñuñoa",
  city: "Santiago",
  region: "Región Metropolitana",
  isPublished: true,
  isFeatured: false,
  features: [{ id: "f1", name: "Piscina", slug: "piscina" }],
  images: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  publishedAt: "2026-01-05T00:00:00.000Z",
};

/** Rellena lo imprescindible para que el formulario pase la validación. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Título"), "Casa nueva");
  await user.type(screen.getByLabelText("Descripción"), "Con patio.");
  await user.type(screen.getByLabelText(/^Precio/), "250000");
  await user.type(screen.getByLabelText("Dirección"), "Calle 1");
  await user.type(screen.getByLabelText("Comuna"), "Ñuñoa");
  await user.type(screen.getByLabelText("Ciudad"), "Santiago");
  await user.type(screen.getByLabelText("Región"), "Metropolitana");
}

afterEach(() => {
  window.sessionStorage.clear();
  resetFlashForTests();
  for (const mock of [
    createAdminProperty,
    updateAdminProperty,
    push,
    refresh,
  ]) {
    mock.mockReset();
  }
});

describe("PropertyForm", () => {
  it("no pide latitud ni longitud", () => {
    // Las coordenadas las deduce el servidor a partir de la dirección.
    render(<PropertyForm features={FEATURES} />);

    expect(screen.queryByLabelText(/latitud/i)).toBeNull();
    expect(screen.queryByLabelText(/longitud/i)).toBeNull();
  });

  it("ofrece las características como casillas, no como texto libre", () => {
    render(<PropertyForm features={FEATURES} />);

    expect(screen.getByRole("checkbox", { name: "Piscina" })).toBeVisible();
    expect(
      screen.getByRole("checkbox", { name: "Estacionamiento" }),
    ).toBeVisible();
  });

  it("avisa cuando no hay ninguna característica registrada", () => {
    render(<PropertyForm features={[]} />);

    expect(
      screen.getByText("Todavía no hay características registradas."),
    ).toBeVisible();
  });

  it("crea la propiedad despublicada mientras no se marque lo contrario", async () => {
    const user = userEvent.setup();

    render(<PropertyForm features={FEATURES} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    await waitFor(() => expect(createAdminProperty).toHaveBeenCalledTimes(1));
    expect(createAdminProperty.mock.calls[0][0]).toMatchObject({
      title: "Casa nueva",
      price: 250_000,
      isPublished: false,
      isFeatured: false,
    });
  });

  it("envía nulo, y no cero, en los campos que se dejan en blanco", async () => {
    const user = userEvent.setup();

    render(<PropertyForm features={FEATURES} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    await waitFor(() => expect(createAdminProperty).toHaveBeenCalled());
    expect(createAdminProperty.mock.calls[0][0]).toMatchObject({
      bedrooms: null,
      bathrooms: null,
      ageYears: null,
    });
  });

  it("no llama a la API si falta un campo obligatorio", async () => {
    const user = userEvent.setup();

    render(<PropertyForm features={FEATURES} />);
    await user.type(screen.getByLabelText("Título"), "Casa sin dirección");
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    expect(await screen.findByText("Falta la comuna.")).toBeVisible();
    expect(createAdminProperty).not.toHaveBeenCalled();
  });

  it("vuelve al listado tras crear, y lo repinta", async () => {
    const user = userEvent.setup();

    createAdminProperty.mockResolvedValue(PROPERTY);

    render(<PropertyForm features={FEATURES} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/properties"));
    expect(refresh).toHaveBeenCalled();
  });

  it("al editar, parte de lo que ya está guardado", () => {
    render(<PropertyForm features={FEATURES} property={PROPERTY} />);

    expect(screen.getByLabelText("Título")).toHaveValue("Casa en Ñuñoa");
    expect(screen.getByLabelText("Operación")).toHaveValue("RENT");
    expect(screen.getByRole("checkbox", { name: "Piscina" })).toBeChecked();
    expect(
      screen.getByRole("checkbox", { name: "Estacionamiento" }),
    ).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Publicada" })).toBeChecked();
  });

  it("distingue el cero guardado del campo vacío", () => {
    render(<PropertyForm features={FEATURES} property={PROPERTY} />);

    // Antigüedad cero significa «nueva», no «sin declarar».
    expect(screen.getByLabelText(/^Antigüedad/)).toHaveValue(0);
    expect(screen.getByLabelText("Baños")).toHaveValue(null);
  });

  it("actualiza en lugar de crear cuando ya existe la propiedad", async () => {
    const user = userEvent.setup();

    updateAdminProperty.mockResolvedValue(PROPERTY);

    render(<PropertyForm features={FEATURES} property={PROPERTY} />);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateAdminProperty).toHaveBeenCalled());
    expect(updateAdminProperty.mock.calls[0][0]).toBe("prop-1");
    expect(createAdminProperty).not.toHaveBeenCalled();
  });

  it("manda la lista definitiva de características al desmarcar una", async () => {
    const user = userEvent.setup();

    updateAdminProperty.mockResolvedValue(PROPERTY);

    render(<PropertyForm features={FEATURES} property={PROPERTY} />);
    await user.click(screen.getByRole("checkbox", { name: "Piscina" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateAdminProperty).toHaveBeenCalled());
    expect(updateAdminProperty.mock.calls[0][1]).toMatchObject({
      featureSlugs: [],
    });
  });

  it("muestra el motivo que da el servidor", async () => {
    const user = userEvent.setup();

    createAdminProperty.mockRejectedValue(
      new Error("Estas características no existen: helipuerto."),
    );

    render(<PropertyForm features={FEATURES} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    expect(
      await screen.findByText("Estas características no existen: helipuerto."),
    ).toBeVisible();
    expect(push).not.toHaveBeenCalled();
  });
});

describe("PropertyForm: avisos de confirmación", () => {
  it("dice que la propiedad nueva quedó como borrador", async () => {
    const user = userEvent.setup();
    createAdminProperty.mockResolvedValue(PROPERTY);

    render(<PropertyForm features={FEATURES} />);
    await fillRequiredFields(user);
    await user.click(screen.getByRole("button", { name: "Crear propiedad" }));

    await waitFor(() => expect(createAdminProperty).toHaveBeenCalled());
    // Nace despublicada: decir solo «creada» haría pensar que ya está en el
    // portal, y no lo está.
    expect(readFlash()[0]?.text).toContain("borrador");
  });

  it("distingue publicar de guardar una corrección", async () => {
    const user = userEvent.setup();
    updateAdminProperty.mockResolvedValue(PROPERTY);

    render(<PropertyForm features={FEATURES} property={PROPERTY} />);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateAdminProperty).toHaveBeenCalled());
    // Sin cambiar el estado de publicación, el aviso es el de guardar.
    expect(readFlash()[0]?.text).toContain("Se guardaron los cambios");
  });

  it("no anuncia nada cuando el servidor rechaza el guardado", async () => {
    const user = userEvent.setup();
    updateAdminProperty.mockRejectedValue(new Error("El precio es inválido."));

    render(<PropertyForm features={FEATURES} property={PROPERTY} />);
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateAdminProperty).toHaveBeenCalled());
    expect(readFlash()).toEqual([]);
  });
});
