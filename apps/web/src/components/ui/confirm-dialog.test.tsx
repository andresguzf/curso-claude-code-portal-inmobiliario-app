import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ConfirmDialog } from "./confirm-dialog";

const onConfirm = vi.fn();
const onCancel = vi.fn();

function renderDialog(overrides = {}) {
  return render(
    <ConfirmDialog
      isOpen
      title="Quitar de tu historial"
      description="Esta acción no se deshace."
      confirmLabel="Sí, quitarla"
      cancelLabel="No, conservarla"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );
}

afterEach(() => {
  onConfirm.mockReset();
  onCancel.mockReset();
});

describe("ConfirmDialog", () => {
  it("permanece cerrado mientras no se pida abrirlo", () => {
    renderDialog({ isOpen: false });

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("se anuncia por su título y su descripción", () => {
    renderDialog();

    const dialogo = screen.getByRole("dialog");

    expect(dialogo).toHaveAccessibleName("Quitar de tu historial");
    expect(dialogo).toHaveAccessibleDescription("Esta acción no se deshace.");
  });

  it("confirma y cancela por separado", async () => {
    const user = userEvent.setup();

    renderDialog();
    await user.click(screen.getByRole("button", { name: "Sí, quitarla" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "No, conservarla" }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancela también al cerrarse con Esc", () => {
    renderDialog();

    // El navegador cierra el diálogo por su cuenta: sin escuchar `close`, el
    // estado de React se quedaría creyendo que sigue abierto.
    screen.getByRole("dialog").dispatchEvent(new Event("close"));

    expect(onCancel).toHaveBeenCalled();
  });

  it("bloquea ambos botones mientras la acción está en curso", () => {
    renderDialog({ isPending: true, pendingLabel: "Quitando…" });

    expect(
      screen.getByRole("button", { name: "No, conservarla" }),
    ).toBeDisabled();
    expect(screen.getByRole("button", { name: "Quitando…" })).toBeDisabled();
  });

  it("anuncia la espera con un texto genérico si no se le da uno", () => {
    renderDialog({ isPending: true });

    expect(screen.getByRole("button", { name: "Un momento…" })).toBeDisabled();
  });

  it("se cierra cuando deja de pedirse abierto", async () => {
    const { rerender } = renderDialog();

    expect(screen.getByRole("dialog")).toBeVisible();

    rerender(
      <ConfirmDialog
        isOpen={false}
        title="Quitar de tu historial"
        description="Esta acción no se deshace."
        confirmLabel="Sí, quitarla"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});
