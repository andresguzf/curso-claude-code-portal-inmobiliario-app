import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { logIn, replace, refresh } = vi.hoisted(() => ({
  logIn: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ logIn }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, refresh, push: vi.fn() }),
}));

import { LoginForm } from "./login-form";

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Email"), "maria@example.com");
  await user.type(screen.getByLabelText("Contraseña"), "maria1234");
}

afterEach(() => {
  logIn.mockReset();
  replace.mockReset();
  refresh.mockReset();
});

describe("LoginForm", () => {
  it("oculta la contraseña mientras se escribe", () => {
    render(<LoginForm redirectTo="/" />);

    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "type",
      "password",
    );
    expect(screen.getByLabelText("Contraseña")).toHaveAttribute(
      "autocomplete",
      "current-password",
    );
  });

  it("no llama a la API si faltan datos", async () => {
    const user = userEvent.setup();

    render(<LoginForm redirectTo="/" />);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByText("Escribe tu contraseña.")).toBeVisible();
    expect(logIn).not.toHaveBeenCalled();
  });

  it("envía las credenciales y lleva al destino indicado", async () => {
    const user = userEvent.setup();

    logIn.mockResolvedValue({
      id: "1",
      name: "María",
      email: "m@e.cl",
      role: "USER",
    });
    render(<LoginForm redirectTo="/properties" />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    await waitFor(() => expect(logIn).toHaveBeenCalledTimes(1));
    expect(logIn).toHaveBeenCalledWith({
      email: "maria@example.com",
      password: "maria1234",
    });
    expect(replace).toHaveBeenCalledWith("/properties");
    // El header se pinta en el servidor: hay que pedirle la página de nuevo.
    expect(refresh).toHaveBeenCalled();
  });

  it("muestra el motivo del rechazo sin quedarse callado", async () => {
    const user = userEvent.setup();

    logIn.mockRejectedValue(new Error("Email o contraseña incorrectos."));
    render(<LoginForm redirectTo="/" />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    expect(
      await screen.findByText("Email o contraseña incorrectos."),
    ).toBeVisible();
    expect(replace).not.toHaveBeenCalled();
  });

  it("avisa mientras comprueba las credenciales", async () => {
    const user = userEvent.setup();
    let resolveLogin: (value: unknown) => void = () => {};

    logIn.mockReturnValue(
      new Promise((resolve) => {
        resolveLogin = resolve;
      }),
    );
    render(<LoginForm redirectTo="/" />);
    await fillCredentials(user);
    await user.click(screen.getByRole("button", { name: "Entrar" }));

    const button = await screen.findByRole("button", { name: "Entrando…" });

    expect(button).toBeDisabled();
    resolveLogin({ id: "1", name: "María", email: "m@e.cl", role: "USER" });
  });
});
