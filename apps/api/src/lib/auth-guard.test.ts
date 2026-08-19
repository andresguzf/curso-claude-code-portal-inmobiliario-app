import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieValue: undefined as string | undefined,
  getAuthenticatedUser: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      mocks.cookieValue === undefined
        ? undefined
        : { name, value: mocks.cookieValue },
  }),
}));

vi.mock("@/services/auth-service", () => ({
  getAuthenticatedUser: mocks.getAuthenticatedUser,
}));

import { requireAdmin, requireAuthenticatedUser } from "./auth-guard";

const ADMIN = {
  id: "u1",
  name: "Administradora",
  email: "admin@portal.cl",
  role: "ADMIN",
} as const;

const USER = {
  id: "u2",
  name: "María",
  email: "maria@example.com",
  role: "USER",
} as const;

afterEach(() => {
  mocks.cookieValue = undefined;
  mocks.getAuthenticatedUser.mockReset();
});

describe("requireAuthenticatedUser", () => {
  it("deja pasar a quien tiene sesión válida", async () => {
    mocks.cookieValue = "testigo";
    mocks.getAuthenticatedUser.mockResolvedValue(USER);

    const result = await requireAuthenticatedUser();

    expect(result).toEqual({ ok: true, user: USER });
  });

  it("responde 401 sin cookie", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const result = await requireAuthenticatedUser();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(401);
  });

  it("responde 401 si el servicio rechaza el testigo", async () => {
    // Cuenta desactivada, testigo caducado o firmado con otro secreto.
    mocks.cookieValue = "testigo-que-ya-no-vale";
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const result = await requireAuthenticatedUser();

    expect(result.ok).toBe(false);
  });

  it("consulta la sesión con el valor de la cookie", async () => {
    mocks.cookieValue = "testigo-concreto";
    mocks.getAuthenticatedUser.mockResolvedValue(USER);

    await requireAuthenticatedUser();

    expect(mocks.getAuthenticatedUser).toHaveBeenCalledWith("testigo-concreto");
  });
});

describe("requireAdmin", () => {
  it("deja pasar a un ADMIN", async () => {
    mocks.cookieValue = "testigo";
    mocks.getAuthenticatedUser.mockResolvedValue(ADMIN);

    expect(await requireAdmin()).toEqual({ ok: true, user: ADMIN });
  });

  it("responde 403 a un USER autenticado", async () => {
    // 403 y no 401: quien ya entró no arregla nada volviendo a entrar.
    mocks.cookieValue = "testigo";
    mocks.getAuthenticatedUser.mockResolvedValue(USER);

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(403);
  });

  it("responde 401 a quien no ha iniciado sesión", async () => {
    mocks.getAuthenticatedUser.mockResolvedValue(null);

    const result = await requireAdmin();

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.response.status).toBe(401);
  });

  it("no confía en el rol del testigo, sino en el que devuelve el servicio", async () => {
    mocks.cookieValue = "testigo";
    mocks.getAuthenticatedUser.mockResolvedValue({ ...USER, role: "USER" });

    expect((await requireAdmin()).ok).toBe(false);

    mocks.getAuthenticatedUser.mockResolvedValue({ ...USER, role: "ADMIN" });

    expect((await requireAdmin()).ok).toBe(true);
  });
});
