import { describe, expect, it } from "vitest";

import { AUTH_LIMITS } from "@portal/contracts";

import {
  validateAdminUserCreation,
  validateAdminUserUpdate,
} from "./admin-user-validation";

function creationOf(payload: unknown) {
  const result = validateAdminUserCreation(payload);

  if (!result.ok) {
    throw new Error(`Se esperaba un alta válida: ${result.message}`);
  }

  return result.user;
}

function creationRejectionOf(payload: unknown): string {
  const result = validateAdminUserCreation(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

const ALTA_VALIDA = {
  name: "  Ana Pérez  ",
  email: "ana.nueva@example.com",
  password: "contrasena-larga",
};

function acceptedOf(payload: unknown) {
  const result = validateAdminUserUpdate(payload);

  if (!result.ok) {
    throw new Error(`Se esperaban cambios válidos: ${result.message}`);
  }

  return result.changes;
}

function rejectionOf(payload: unknown): string {
  const result = validateAdminUserUpdate(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

describe("validateAdminUserUpdate", () => {
  it("solo devuelve lo que viaja: es un PATCH", () => {
    // Lo ausente no se toca, y por eso no aparece en los cambios.
    expect(acceptedOf({ isActive: false })).toEqual({ isActive: false });
  });

  it("acepta varios cambios a la vez", () => {
    expect(acceptedOf({ name: "  Ana  ", role: "ADMIN" })).toEqual({
      name: "Ana",
      role: "ADMIN",
    });
  });

  it("rechaza un cuerpo sin ningún cambio", () => {
    expect(rejectionOf({})).toBe("No hay ningún cambio que aplicar.");
    expect(rejectionOf(null)).toBe("El cuerpo de la solicitud es inválido.");
  });

  it("trata la contraseña vacía como «no cambiarla»", () => {
    // Nunca como «ponerla en blanco».
    expect(acceptedOf({ newPassword: "", isActive: true })).toEqual({
      isActive: true,
    });
  });

  it("exige el largo mínimo si se cambia la contraseña", () => {
    expect(rejectionOf({ newPassword: "corta" })).toMatch(/al menos/);
  });

  it("admite una contraseña válida", () => {
    const larga = "a".repeat(AUTH_LIMITS.minPasswordLength);

    expect(acceptedOf({ newPassword: larga })).toEqual({ newPassword: larga });
  });

  it("rechaza un nombre vacío, que no es lo mismo que no enviarlo", () => {
    expect(rejectionOf({ name: "   " })).toBe("El nombre es obligatorio.");
  });

  it("rechaza un email mal formado", () => {
    expect(rejectionOf({ email: "arroba-ninguna" })).toBe(
      "El email no es válido.",
    );
  });

  it("rechaza un rol inventado", () => {
    expect(rejectionOf({ role: "SUPERADMIN" })).toBe("El rol no es válido.");
  });

  it("exige que el estado sea booleano, no la cadena «false»", () => {
    expect(rejectionOf({ isActive: "false" })).toMatch(/verdadero o falso/);
  });
});

describe("validateAdminUserCreation", () => {
  it("da de alta con rol USER y activa por omisión", () => {
    // Una cuenta que nace sin poder entrar no le sirve a nadie.
    expect(creationOf(ALTA_VALIDA)).toEqual({
      name: "Ana Pérez",
      email: "ana.nueva@example.com",
      password: "contrasena-larga",
      role: "USER",
      isActive: true,
    });
  });

  it("admite crear otra administración", () => {
    // Es la única vía dentro de la aplicación: el registro público solo crea
    // cuentas USER.
    expect(creationOf({ ...ALTA_VALIDA, role: "ADMIN" }).role).toBe("ADMIN");
  });

  it("exige nombre, email y contraseña", () => {
    expect(creationRejectionOf({ ...ALTA_VALIDA, name: "  " })).toBe(
      "El nombre es obligatorio.",
    );
    expect(creationRejectionOf({ ...ALTA_VALIDA, email: "" })).toBe(
      "El email es obligatorio.",
    );
    expect(creationRejectionOf({ ...ALTA_VALIDA, password: "" })).toMatch(
      /al menos/,
    );
  });

  it("rechaza una contraseña corta, como el registro público", () => {
    expect(creationRejectionOf({ ...ALTA_VALIDA, password: "corta" })).toMatch(
      /al menos 8/,
    );
  });

  it("rechaza un email mal formado y un rol inventado", () => {
    expect(creationRejectionOf({ ...ALTA_VALIDA, email: "sin-arroba" })).toBe(
      "El email no es válido.",
    );
    expect(creationRejectionOf({ ...ALTA_VALIDA, role: "SUPERADMIN" })).toBe(
      "El rol no es válido.",
    );
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    expect(creationRejectionOf(null)).toBe(
      "El cuerpo de la solicitud es inválido.",
    );
  });
});
