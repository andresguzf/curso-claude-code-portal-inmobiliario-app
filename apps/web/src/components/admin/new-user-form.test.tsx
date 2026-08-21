import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { createAdminUser, refresh } = vi.hoisted(() => ({
  createAdminUser: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ createAdminUser }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { NewUserForm } from "./new-user-form";

/** Abre el panel y rellena los tres campos obligatorios. */
async function fillForm(
  user: ReturnType<typeof userEvent.setup>,
  overrides: { readonly role?: string } = {},
) {
  await user.click(screen.getByRole("button", { name: /Nueva cuenta/ }));
  await user.type(screen.getByLabelText("Nombre"), "Ana Nueva");
  await user.type(screen.getByLabelText("Email"), "ana.nueva@example.com");
  await user.type(
    screen.getByLabelText(/Contraseña inicial/),
    "contrasena-larga",
  );

  if (overrides.role) {
    await user.selectOptions(screen.getByLabelText("Rol"), overrides.role);
  }
}

afterEach(() => {
  createAdminUser.mockReset();
  refresh.mockReset();
});

describe("NewUserForm", () => {
  it("empieza plegado: dar de alta es lo excepcional aquí", () => {
    render(<NewUserForm />);

    expect(
      screen.getByRole("button", { name: /Nueva cuenta/ }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("crea con rol usuario por omisión", async () => {
    const user = userEvent.setup();

    createAdminUser.mockResolvedValue({ id: "u1" });

    render(<NewUserForm />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(createAdminUser).toHaveBeenCalledWith({
        name: "Ana Nueva",
        email: "ana.nueva@example.com",
        password: "contrasena-larga",
        role: "USER",
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("permite dar de alta otra administración", async () => {
    const user = userEvent.setup();

    createAdminUser.mockResolvedValue({ id: "u1" });

    render(<NewUserForm />);
    await fillForm(user, { role: "ADMIN" });
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(createAdminUser.mock.calls[0][0]).toMatchObject({
        role: "ADMIN",
      }),
    );
  });

  it("avisa de que la contraseña hay que comunicarla", async () => {
    const user = userEvent.setup();

    // No hay forma de recuperarla después: solo reemplazarla.
    createAdminUser.mockResolvedValue({ id: "u1" });

    render(<NewUserForm />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByText(/Comunícale su contraseña/)).toBeVisible();
  });

  it("vacía el formulario para poder encadenar varias", async () => {
    const user = userEvent.setup();

    createAdminUser.mockResolvedValue({ id: "u1" });

    render(<NewUserForm />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() =>
      expect(screen.getByLabelText("Nombre")).toHaveValue(""),
    );
    expect(screen.getByLabelText("Email")).toHaveValue("");
  });

  it("muestra el motivo que da el servidor", async () => {
    const user = userEvent.setup();

    createAdminUser.mockRejectedValue(
      new Error("Ese email ya pertenece a otra cuenta."),
    );

    render(<NewUserForm />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(
      await screen.findByText("Ese email ya pertenece a otra cuenta."),
    ).toBeVisible();
  });

  it("conserva lo escrito cuando el alta falla", async () => {
    const user = userEvent.setup();

    createAdminUser.mockRejectedValue(new Error("Ese email ya pertenece."));

    render(<NewUserForm />);
    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Crear cuenta" }));

    await waitFor(() => expect(createAdminUser).toHaveBeenCalled());
    expect(screen.getByLabelText("Nombre")).toHaveValue("Ana Nueva");
  });
});
