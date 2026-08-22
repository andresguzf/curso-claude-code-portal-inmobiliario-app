import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminFeatureDto } from "@portal/contracts";

const { createAdminFeature, renameAdminFeature, deleteAdminFeature, refresh } =
  vi.hoisted(() => ({
    createAdminFeature: vi.fn(),
    renameAdminFeature: vi.fn(),
    deleteAdminFeature: vi.fn(),
    refresh: vi.fn(),
  }));

vi.mock("@/lib/api-client", () => ({
  createAdminFeature,
  renameAdminFeature,
  deleteAdminFeature,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { FeatureManager } from "./feature-manager";
import { readFlash, resetFlashForTests } from "@/lib/flash";

const FEATURES: readonly AdminFeatureDto[] = [
  { id: "f1", name: "Piscina", slug: "piscina", propertyCount: 3 },
  { id: "f2", name: "Quincho", slug: "quincho", propertyCount: 0 },
];

function renderManager(features: readonly AdminFeatureDto[] = FEATURES) {
  return render(<FeatureManager features={features} />);
}

afterEach(() => {
  window.sessionStorage.clear();
  resetFlashForTests();
  for (const mock of [
    createAdminFeature,
    renameAdminFeature,
    deleteAdminFeature,
    refresh,
  ]) {
    mock.mockReset();
  }
});

describe("FeatureManager", () => {
  it("muestra el identificador y cuántas propiedades la usan", () => {
    renderManager();

    expect(screen.getByText("piscina")).toBeVisible();
    expect(screen.getByText("3 propiedades")).toBeVisible();
    expect(screen.getByText("0 propiedades")).toBeVisible();
  });

  it("concuerda el recuento cuando solo la usa una", () => {
    renderManager([{ ...FEATURES[0], propertyCount: 1 }]);

    expect(screen.getByText("1 propiedad")).toBeVisible();
  });

  it("avisa cuando no hay ninguna", () => {
    renderManager([]);

    expect(
      screen.getByText("Todavía no hay características. Crea la primera."),
    ).toBeVisible();
  });

  it("da de alta una nueva", async () => {
    const user = userEvent.setup();

    createAdminFeature.mockResolvedValue(FEATURES[0]);

    renderManager();
    await user.type(
      screen.getByLabelText("Nueva característica"),
      "Piscina temperada",
    );
    await user.click(screen.getByRole("button", { name: "Añadir" }));

    await waitFor(() =>
      expect(createAdminFeature).toHaveBeenCalledWith("Piscina temperada"),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("no envía un nombre vacío", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(screen.getByRole("button", { name: "Añadir" }));

    expect(createAdminFeature).not.toHaveBeenCalled();
  });

  it("vacía el campo para poder encadenar varias", async () => {
    const user = userEvent.setup();

    createAdminFeature.mockResolvedValue(FEATURES[0]);

    renderManager();
    const campo = screen.getByLabelText("Nueva característica");

    await user.type(campo, "Sala de juegos");
    await user.click(screen.getByRole("button", { name: "Añadir" }));

    await waitFor(() => expect(campo).toHaveValue(""));
  });

  it("renombra sin tocar el identificador", async () => {
    const user = userEvent.setup();

    renameAdminFeature.mockResolvedValue(FEATURES[0]);

    renderManager();
    await user.click(screen.getByRole("button", { name: "Renombrar Piscina" }));

    const campo = screen.getByLabelText("Nombre de Piscina");

    await user.clear(campo);
    await user.type(campo, "Piscina climatizada");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(renameAdminFeature).toHaveBeenCalledWith(
        "f1",
        "Piscina climatizada",
      ),
    );
  });

  it("cancelar deja el nombre como estaba", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(screen.getByRole("button", { name: "Renombrar Piscina" }));
    await user.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(renameAdminFeature).not.toHaveBeenCalled();
    expect(screen.getByText("Piscina")).toBeVisible();
  });

  it("dice a cuántas propiedades afecta eliminarla", async () => {
    const user = userEvent.setup();

    // «Dejará de figurar» a secas ocultaría que esto toca fichas publicadas.
    renderManager();
    await user.click(screen.getByRole("button", { name: "Eliminar Piscina" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      /3 propiedades dejarán de declarar «Piscina»/,
    );
  });

  it("concuerda el número cuando solo la usa una", async () => {
    const user = userEvent.setup();

    renderManager([{ ...FEATURES[0], propertyCount: 1 }]);
    await user.click(screen.getByRole("button", { name: "Eliminar Piscina" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      /1 propiedad dejará de declarar/,
    );
  });

  it("lo dice también cuando no la usa ninguna", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(screen.getByRole("button", { name: "Eliminar Quincho" }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      /no la usa ninguna propiedad/,
    );
  });

  it("no elimina hasta que se confirma", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(screen.getByRole("button", { name: "Eliminar Piscina" }));

    expect(deleteAdminFeature).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Sí, eliminarla" }));

    await waitFor(() => expect(deleteAdminFeature).toHaveBeenCalledWith("f1"));
  });

  it("deja la fila abierta y el texto puesto si el guardado falla", async () => {
    const user = userEvent.setup();

    // Cerrarla perdería lo escrito, y el aviso quedaría lejos de donde se
    // estaba mirando.
    renameAdminFeature.mockRejectedValue(new Error("«Quincho» ya existe."));

    renderManager();
    await user.click(screen.getByRole("button", { name: "Renombrar Piscina" }));

    const campo = screen.getByLabelText("Nombre de Piscina");

    await user.clear(campo);
    await user.type(campo, "Quincho");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(await screen.findByText("«Quincho» ya existe.")).toBeVisible();
    expect(screen.getByLabelText("Nombre de Piscina")).toHaveValue("Quincho");
  });

  it("cierra la fila cuando el guardado sale bien", async () => {
    const user = userEvent.setup();

    renameAdminFeature.mockResolvedValue(FEATURES[0]);

    renderManager();
    await user.click(screen.getByRole("button", { name: "Renombrar Piscina" }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(screen.queryByLabelText("Nombre de Piscina")).toBeNull(),
    );
  });

  it("selecciona el texto al abrir, para poder reemplazarlo de una vez", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(screen.getByRole("button", { name: "Renombrar Piscina" }));

    const campo = screen.getByLabelText<HTMLInputElement>("Nombre de Piscina");

    expect(campo.selectionStart).toBe(0);
    expect(campo.selectionEnd).toBe("Piscina".length);
  });

  it("muestra el motivo que da el servidor", async () => {
    const user = userEvent.setup();

    createAdminFeature.mockRejectedValue(new Error("«Piscina» ya existe."));

    renderManager();
    await user.type(screen.getByLabelText("Nueva característica"), "piscina");
    await user.click(screen.getByRole("button", { name: "Añadir" }));

    expect(await screen.findByText("«Piscina» ya existe.")).toBeVisible();
  });
});

describe("FeatureManager: avisos de confirmación", () => {
  it("anuncia el alta con el nombre creado", async () => {
    const usuario = userEvent.setup();
    createAdminFeature.mockResolvedValue({
      id: "f3",
      name: "Bodega",
      slug: "bodega",
      propertyCount: 0,
    });
    renderManager();

    await usuario.type(screen.getByLabelText("Nueva característica"), "Bodega");
    await usuario.click(screen.getByRole("button", { name: "Añadir" }));

    await waitFor(() => expect(createAdminFeature).toHaveBeenCalled());
    expect(readFlash().map((m) => m.text).join(" ")).toContain("Bodega");
  });

  it("no anuncia nada cuando el alta falla", async () => {
    const usuario = userEvent.setup();
    createAdminFeature.mockRejectedValue(new Error("Ya existe."));
    renderManager();

    await usuario.type(screen.getByLabelText("Nueva característica"), "Piscina");
    await usuario.click(screen.getByRole("button", { name: "Añadir" }));

    await waitFor(() => expect(createAdminFeature).toHaveBeenCalled());
    // El fallo se explica en el formulario, junto a lo que hay que corregir;
    // anunciarlo arriba además diría que algo salió bien.
    expect(readFlash()).toEqual([]);
  });
});
