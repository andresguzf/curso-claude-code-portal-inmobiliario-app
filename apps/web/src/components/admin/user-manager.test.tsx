import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { AdminUserDto } from "@portal/contracts";

const { updateAdminUser, refresh } = vi.hoisted(() => ({
  updateAdminUser: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({ updateAdminUser }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { UserManager } from "./user-manager";
import { readFlash, resetFlashForTests } from "@/lib/flash";

const ADMIN_ID = "admin-1";

function buildUser(overrides: Partial<AdminUserDto> = {}): AdminUserDto {
  return {
    id: "user-2",
    name: "María",
    email: "maria@example.com",
    role: "USER",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    favoriteCount: 2,
    inquiryCount: 1,
    ...overrides,
  };
}

const ADMIN = buildUser({
  id: ADMIN_ID,
  name: "Administradora",
  email: "admin@portal.cl",
  role: "ADMIN",
});

function renderManager(users: readonly AdminUserDto[] = [buildUser(), ADMIN]) {
  return render(<UserManager users={users} currentAdminId={ADMIN_ID} />);
}

/** La tarjeta de una cuenta, para no confundir botones entre filas. */
function rowOf(name: string): HTMLElement {
  const heading = screen.getByText(
    (_, element) =>
      element?.tagName === "P" &&
      element.textContent?.startsWith(name) === true,
  );

  return heading.closest("article") as HTMLElement;
}

afterEach(() => {
  window.sessionStorage.clear();
  resetFlashForTests();
  updateAdminUser.mockReset();
  refresh.mockReset();
});

describe("UserManager, sobre otra cuenta", () => {
  it("muestra rol y estado con texto, no solo con color", () => {
    renderManager([buildUser({ isActive: false })]);

    expect(screen.getByText("Usuario")).toBeVisible();
    expect(screen.getByText("Desactivada")).toBeVisible();
  });

  it("pide confirmación antes de desactivar", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Desactivar/ }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(
      /dejará de poder entrar/,
    );
    expect(updateAdminUser).not.toHaveBeenCalled();
  });

  it("explica que los favoritos y las consultas se conservan", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Desactivar/ }),
    );

    expect(screen.getByRole("dialog")).toHaveTextContent(/se conservan/);
  });

  it("desactiva al confirmar", async () => {
    const user = userEvent.setup();

    renderManager();
    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Desactivar/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, desactivarla" }));

    await waitFor(() =>
      expect(updateAdminUser).toHaveBeenCalledWith("user-2", {
        isActive: false,
      }),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("ofrece reactivar a quien está fuera", async () => {
    const user = userEvent.setup();

    renderManager([buildUser({ isActive: false })]);
    await user.click(screen.getByRole("button", { name: /Reactivar/ }));
    await user.click(screen.getByRole("button", { name: "Sí, reactivarla" }));

    await waitFor(() =>
      expect(updateAdminUser).toHaveBeenCalledWith("user-2", {
        isActive: true,
      }),
    );
  });

  it("da y quita el rol de administración", async () => {
    const user = userEvent.setup();

    renderManager([buildUser()]);
    await user.click(
      screen.getByRole("button", { name: /Hacer administrador/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, darle acceso" }));

    await waitFor(() =>
      expect(updateAdminUser).toHaveBeenCalledWith("user-2", {
        role: "ADMIN",
      }),
    );
  });

  it("edita nombre y email sin pedir la contraseña actual", async () => {
    const user = userEvent.setup();

    renderManager([buildUser()]);
    await user.click(screen.getByRole("button", { name: /Editar la cuenta/ }));

    expect(screen.queryByLabelText(/contraseña actual/i)).toBeNull();

    const nombre = screen.getByLabelText("Nombre");

    await user.clear(nombre);
    await user.type(nombre, "María Soto");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() =>
      expect(updateAdminUser).toHaveBeenCalledWith("user-2", {
        name: "María Soto",
        email: "maria@example.com",
      }),
    );
  });

  it("no envía la contraseña si se deja en blanco", async () => {
    const user = userEvent.setup();

    // En blanco significa «no cambiarla», nunca «ponerla en blanco».
    renderManager([buildUser()]);
    await user.click(screen.getByRole("button", { name: /Editar la cuenta/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateAdminUser).toHaveBeenCalled());
    expect(updateAdminUser.mock.calls[0][1]).not.toHaveProperty("newPassword");
  });

  it("deja el formulario abierto y avisa si el guardado falla", async () => {
    const user = userEvent.setup();

    updateAdminUser.mockRejectedValue(
      new Error("Ese email ya pertenece a otra cuenta."),
    );

    renderManager([buildUser()]);
    await user.click(screen.getByRole("button", { name: /Editar la cuenta/ }));
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    expect(
      await screen.findByText("Ese email ya pertenece a otra cuenta."),
    ).toBeVisible();
    expect(screen.getByLabelText("Nombre")).toBeVisible();
  });
});

describe("UserManager, sobre la propia cuenta", () => {
  it("no ofrece desactivarse ni quitarse el rol", () => {
    // El portal se quedaría sin administración y sin forma de recuperarla.
    renderManager();

    const propia = rowOf("Administradora");

    expect(
      within(propia).queryByRole("button", { name: /Desactivar/ }),
    ).toBeNull();
    expect(
      within(propia).queryByRole("button", { name: /Quitar administración/ }),
    ).toBeNull();
  });

  it("explica por qué faltan esos controles", () => {
    renderManager();

    expect(
      within(rowOf("Administradora")).getByText(
        /no puedes desactivarte ni quitarte el rol/i,
      ),
    ).toBeVisible();
  });

  it("sí deja editar sus propios datos", () => {
    renderManager();

    expect(
      within(rowOf("Administradora")).getByRole("button", {
        name: /Editar la cuenta/,
      }),
    ).toBeVisible();
  });

  it("señala cuál es la cuenta de quien administra", () => {
    renderManager();

    expect(screen.getByText("(tu cuenta)")).toBeVisible();
  });
});

describe("UserManager, sin resultados", () => {
  it("lo dice en vez de mostrar una lista vacía", () => {
    renderManager([]);

    expect(
      screen.getByText("Ninguna cuenta coincide con lo que has pedido."),
    ).toBeVisible();
  });
});

describe("UserManager: avisos de confirmación", () => {
  it("dice qué pasó al desactivar, nombrando a la persona", async () => {
    const user = userEvent.setup();
    updateAdminUser.mockResolvedValue(buildUser({ isActive: false }));
    renderManager();

    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Desactivar/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, desactivarla" }));

    await waitFor(() => expect(updateAdminUser).toHaveBeenCalled());
    expect(readFlash()[0]?.text).toContain("María");
  });

  it("al cambiar la contraseña recuerda que hay que comunicarla", async () => {
    const user = userEvent.setup();
    updateAdminUser.mockResolvedValue(buildUser());
    renderManager();

    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Editar la cuenta/ }),
    );
    await user.type(screen.getByLabelText(/contraseña/i), "clavenueva123");
    await user.click(screen.getByRole("button", { name: "Guardar" }));

    await waitFor(() => expect(updateAdminUser).toHaveBeenCalled());
    // Es el único cambio que obliga a hacer algo después: sin comunicarla,
    // esa persona se queda fuera.
    expect(readFlash()[0]?.text).toContain("Comunícasela");
  });

  it("no anuncia nada cuando la API rechaza el cambio", async () => {
    const user = userEvent.setup();
    updateAdminUser.mockRejectedValue(new Error("Ese email ya existe."));
    renderManager();

    await user.click(
      within(rowOf("María")).getByRole("button", { name: /Desactivar/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, desactivarla" }));

    await waitFor(() => expect(updateAdminUser).toHaveBeenCalled());
    expect(readFlash()).toEqual([]);
  });
});
