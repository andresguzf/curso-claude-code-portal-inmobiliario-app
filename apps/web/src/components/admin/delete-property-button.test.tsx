import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { deleteAdminProperty, refresh } = vi.hoisted(() => ({
  deleteAdminProperty: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ deleteAdminProperty }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { DeletePropertyButton } from "./delete-property-button";

function renderButton() {
  return render(
    <DeletePropertyButton propertyId="prop-1" propertyTitle="Casa en Ñuñoa" />,
  );
}

afterEach(() => {
  deleteAdminProperty.mockReset();
  refresh.mockReset();
});

describe("DeletePropertyButton", () => {
  it("no elimina nada hasta que se confirma", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(deleteAdminProperty).not.toHaveBeenCalled();
  });

  it("explica que las consultas y los favoritos ajenos se conservan", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));

    expect(screen.getByRole("dialog")).toHaveTextContent(
      /consultas y los favoritos de otras personas se conservan/,
    );
  });

  it("ofrece despublicar como alternativa a eliminar", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));

    expect(screen.getByRole("dialog")).toHaveTextContent(/despublícala/);
  });

  it("elimina y repinta el listado al confirmar", async () => {
    const user = userEvent.setup();

    deleteAdminProperty.mockResolvedValue(undefined);

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));
    await user.click(screen.getByRole("button", { name: "Sí, eliminarla" }));

    await waitFor(() =>
      expect(deleteAdminProperty).toHaveBeenCalledWith("prop-1"),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("conserva la propiedad si se cancela", async () => {
    const user = userEvent.setup();

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));
    await user.click(screen.getByRole("button", { name: "No, conservarla" }));

    expect(deleteAdminProperty).not.toHaveBeenCalled();
  });

  it("avisa cuando el servidor rechaza el borrado", async () => {
    const user = userEvent.setup();

    deleteAdminProperty.mockRejectedValue(
      new Error("Propiedad no encontrada."),
    );

    renderButton();
    await user.click(screen.getByRole("button", { name: /^Eliminar/ }));
    await user.click(screen.getByRole("button", { name: "Sí, eliminarla" }));

    expect(await screen.findByText("Propiedad no encontrada.")).toBeVisible();
    expect(refresh).not.toHaveBeenCalled();
  });
});
