import { afterEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findAdminUsers: vi.fn(),
  findAdminUserById: vi.fn(),
  findUserByEmail: vi.fn(),
  updateUserAsAdmin: vi.fn(),
  normalizeEmail: vi.fn((email: string) => email.toLowerCase()),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
}));

const password = vi.hoisted(() => ({
  hashPassword: vi.fn(async () => "hash-nuevo"),
  verifyPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/user-repository", () => repository);
vi.mock("@/lib/password", () => password);

import { updateUserAsAdministrator } from "./admin-user-service";

const ADMIN_ID = "admin-1";
const OTRA_ID = "user-2";

function buildRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: OTRA_ID,
    name: "María",
    email: "maria@example.com",
    role: "USER" as const,
    isActive: true,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    _count: { favorites: 2, inquiries: 1 },
    ...overrides,
  };
}

afterEach(() => {
  for (const mock of [
    ...Object.values(repository),
    ...Object.values(password),
  ]) {
    mock.mockReset();
  }

  repository.normalizeEmail.mockImplementation((email: string) =>
    email.toLowerCase(),
  );
  password.hashPassword.mockResolvedValue("hash-nuevo");
});

describe("updateUserAsAdministrator, sobre otra cuenta", () => {
  it("desactiva y cambia el rol", async () => {
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.updateUserAsAdmin.mockResolvedValue(
      buildRecord({ isActive: false, role: "ADMIN" }),
    );

    const outcome = await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      isActive: false,
      role: "ADMIN",
    });

    expect(outcome.status).toBe("ok");
    expect(repository.updateUserAsAdmin).toHaveBeenCalledWith(OTRA_ID, {
      isActive: false,
      role: "ADMIN",
    });
  });

  it("guarda la contraseña como hash, nunca en claro", async () => {
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.updateUserAsAdmin.mockResolvedValue(buildRecord());

    await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      newPassword: "contrasena-larga",
    });

    expect(password.hashPassword).toHaveBeenCalledWith("contrasena-larga");
    const [, changes] = repository.updateUserAsAdmin.mock.calls[0];
    expect(changes).toEqual({ passwordHash: "hash-nuevo" });
    expect(JSON.stringify(changes)).not.toContain("contrasena-larga");
  });

  it("no pide la contraseña actual: quien administra no la conoce", async () => {
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.updateUserAsAdmin.mockResolvedValue(buildRecord());

    const outcome = await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      newPassword: "contrasena-larga",
    });

    expect(outcome.status).toBe("ok");
    expect(password.verifyPassword).not.toHaveBeenCalled();
  });

  it("rechaza un email que ya es de otra cuenta", async () => {
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.findUserByEmail.mockResolvedValue({ id: "user-3" });

    const outcome = await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      email: "ana@example.com",
    });

    expect(outcome).toEqual({
      status: "duplicate",
      message: "Ese email ya pertenece a otra cuenta.",
    });
    expect(repository.updateUserAsAdmin).not.toHaveBeenCalled();
  });

  it("deja conservar el email propio", async () => {
    // Que el email siga siendo el suyo no es un choque.
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.findUserByEmail.mockResolvedValue({ id: OTRA_ID });
    repository.updateUserAsAdmin.mockResolvedValue(buildRecord());

    const outcome = await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      email: "maria@example.com",
    });

    expect(outcome.status).toBe("ok");
  });

  it("responde «no encontrado» sobre una cuenta que no existe", async () => {
    repository.findAdminUserById.mockResolvedValue(null);

    expect(
      await updateUserAsAdministrator(ADMIN_ID, "fantasma", {
        isActive: false,
      }),
    ).toEqual({ status: "not-found" });
  });

  it("no devuelve el hash de la contraseña", async () => {
    repository.findAdminUserById.mockResolvedValue(buildRecord());
    repository.updateUserAsAdmin.mockResolvedValue(buildRecord());

    const outcome = await updateUserAsAdministrator(ADMIN_ID, OTRA_ID, {
      name: "María",
    });

    expect(JSON.stringify(outcome)).not.toContain("passwordHash");
  });
});

describe("updateUserAsAdministrator, sobre la propia cuenta", () => {
  function arrangeSelf() {
    repository.findAdminUserById.mockResolvedValue(
      buildRecord({ id: ADMIN_ID, role: "ADMIN" }),
    );
    repository.updateUserAsAdmin.mockResolvedValue(
      buildRecord({ id: ADMIN_ID, role: "ADMIN" }),
    );
  }

  it("no permite desactivarse", async () => {
    // El portal se quedaría sin administración.
    arrangeSelf();

    const outcome = await updateUserAsAdministrator(ADMIN_ID, ADMIN_ID, {
      isActive: false,
    });

    expect(outcome.status).toBe("forbidden");
    expect(repository.updateUserAsAdmin).not.toHaveBeenCalled();
  });

  it("no permite quitarse el rol", async () => {
    // El registro público solo crea cuentas USER: nadie podría devolvérselo.
    arrangeSelf();

    const outcome = await updateUserAsAdministrator(ADMIN_ID, ADMIN_ID, {
      role: "USER",
    });

    expect(outcome.status).toBe("forbidden");
    expect(repository.updateUserAsAdmin).not.toHaveBeenCalled();
  });

  it("sí permite cambiar sus propios datos", async () => {
    arrangeSelf();

    const outcome = await updateUserAsAdministrator(ADMIN_ID, ADMIN_ID, {
      name: "Administradora",
      newPassword: "contrasena-larga",
    });

    expect(outcome.status).toBe("ok");
  });

  it("sí permite reafirmarse en su propio rol y estado", async () => {
    // Enviar el formulario sin tocar esos campos no debe fallar.
    arrangeSelf();

    const outcome = await updateUserAsAdministrator(ADMIN_ID, ADMIN_ID, {
      role: "ADMIN",
      isActive: true,
    });

    expect(outcome.status).toBe("ok");
  });

  it("otra administración sí puede desactivar a esta", async () => {
    // La regla protege contra quedarse sin acceso uno mismo, no impide que
    // el equipo se administre entre sí.
    repository.findAdminUserById.mockResolvedValue(
      buildRecord({ id: "admin-2", role: "ADMIN" }),
    );
    repository.updateUserAsAdmin.mockResolvedValue(
      buildRecord({ id: "admin-2", role: "ADMIN", isActive: false }),
    );

    const outcome = await updateUserAsAdministrator(ADMIN_ID, "admin-2", {
      isActive: false,
    });

    expect(outcome.status).toBe("ok");
  });
});
