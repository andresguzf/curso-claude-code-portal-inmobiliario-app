import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { updateAccount, replace, refresh } = vi.hoisted(() => ({
  updateAccount: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ updateAccount }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

import { AccountForm } from "./account-form";

const MARIA = {
  id: "u1",
  name: "María González",
  email: "maria@example.com",
  role: "USER",
} as const;

function renderForm() {
  return render(<AccountForm name={MARIA.name} email={MARIA.email} />);
}

afterEach(() => {
  updateAccount.mockReset();
  replace.mockReset();
  refresh.mockReset();
});

describe("AccountForm", () => {
  it("llega relleno con los datos actuales", () => {
    renderForm();

    expect(screen.getByLabelText(/^Nombre/)).toHaveValue("María González");
    expect(screen.getByLabelText(/^Email/)).toHaveValue("maria@example.com");
  });

  it("no ofrece cambiar el rol ni el estado de la cuenta", () => {
    // No se pueden cambiar desde aquí: los decide ADMIN.
    renderForm();

    expect(screen.queryByLabelText(/perfil|rol|estado/i)).toBeNull();
  });

  it("deja la contraseña nueva en blanco y explica que es opcional", () => {
    renderForm();

    expect(screen.getByLabelText(/Contraseña nueva/)).toHaveValue("");
    expect(
      screen.getByText(/déjala en blanco para no cambiarla/),
    ).toBeVisible();
  });

  it("exige la contraseña actual para guardar", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText(
        "Escribe tu contraseña actual para guardar los cambios.",
      ),
    ).toBeVisible();
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("no envía la contraseña nueva cuando se deja en blanco", async () => {
    const user = userEvent.setup();

    updateAccount.mockResolvedValue(MARIA);
    renderForm();
    await user.type(screen.getByLabelText(/Contraseña actual/), "maria1234");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(updateAccount).toHaveBeenCalledTimes(1));
    expect(updateAccount).toHaveBeenCalledWith({
      name: "María González",
      email: "maria@example.com",
      currentPassword: "maria1234",
    });
  });

  it("envía la contraseña nueva cuando se escribe", async () => {
    const user = userEvent.setup();

    updateAccount.mockResolvedValue(MARIA);
    renderForm();
    await user.type(screen.getByLabelText(/Contraseña nueva/), "otra distinta");
    await user.type(screen.getByLabelText(/Contraseña actual/), "maria1234");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() =>
      expect(updateAccount).toHaveBeenCalledWith(
        expect.objectContaining({ newPassword: "otra distinta" }),
      ),
    );
  });

  it("rechaza una contraseña nueva demasiado corta antes de llamar a la API", async () => {
    const user = userEvent.setup();

    renderForm();
    await user.type(screen.getByLabelText(/Contraseña nueva/), "corta7c");
    await user.type(screen.getByLabelText(/Contraseña actual/), "maria1234");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(await screen.findByText(/al menos 8 caracteres/)).toBeVisible();
    expect(updateAccount).not.toHaveBeenCalled();
  });

  it("vuelve a la cuenta y refresca la cabecera al guardar", async () => {
    const user = userEvent.setup();

    updateAccount.mockResolvedValue({ ...MARIA, name: "María P." });
    renderForm();
    await user.type(screen.getByLabelText(/Contraseña actual/), "maria1234");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/account"));
    // El nombre también vive en la cabecera, que pinta el servidor.
    expect(refresh).toHaveBeenCalled();
  });

  it("muestra el motivo que devuelve el servidor y no navega", async () => {
    const user = userEvent.setup();

    updateAccount.mockRejectedValue(
      new Error("La contraseña actual no es correcta."),
    );
    renderForm();
    await user.type(screen.getByLabelText(/Contraseña actual/), "la que no es");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));

    expect(
      await screen.findByText("La contraseña actual no es correcta."),
    ).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
  });
});
