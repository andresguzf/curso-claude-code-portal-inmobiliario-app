import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  redirect: vi.fn((destination: string) => {
    throw new Error(`REDIRECT:${destination}`);
  }),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/current-user", () => ({ getCurrentUser: mocks.getCurrentUser }));
vi.mock("next/navigation", () => ({
  redirect: mocks.redirect,
  notFound: mocks.notFound,
}));

import { requireAdminUser, requireCurrentUser } from "./require-user";

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
  mocks.getCurrentUser.mockReset();
  mocks.redirect.mockClear();
  mocks.notFound.mockClear();
});

describe("requireCurrentUser", () => {
  it("devuelve al usuario con sesión iniciada", async () => {
    mocks.getCurrentUser.mockResolvedValue(USER);

    expect(await requireCurrentUser("/account")).toEqual(USER);
  });

  it("lleva al login recordando el destino", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(requireCurrentUser("/account")).rejects.toThrow(
      "REDIRECT:/login?next=%2Faccount",
    );
  });

  it("codifica un destino con parámetros", async () => {
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(
      requireCurrentUser("/admin/properties?page=2"),
    ).rejects.toThrow("REDIRECT:/login?next=%2Fadmin%2Fproperties%3Fpage%3D2");
  });
});

describe("requireAdminUser", () => {
  it("deja pasar a un ADMIN", async () => {
    mocks.getCurrentUser.mockResolvedValue(ADMIN);

    expect(await requireAdminUser("/admin")).toEqual(ADMIN);
  });

  it("responde «no existe» a un USER autenticado", async () => {
    // Mismo criterio que la API con los borradores: si no puedes verlo,
    // tampoco puedes averiguar que está ahí.
    mocks.getCurrentUser.mockResolvedValue(USER);

    await expect(requireAdminUser("/admin")).rejects.toThrow("NOT_FOUND");
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("lleva al login a quien no ha entrado, en vez de decir «no existe»", async () => {
    // Quien no ha iniciado sesión sí puede resolverlo entrando.
    mocks.getCurrentUser.mockResolvedValue(null);

    await expect(requireAdminUser("/admin")).rejects.toThrow(
      "REDIRECT:/login?next=%2Fadmin",
    );
    expect(mocks.notFound).not.toHaveBeenCalled();
  });
});
