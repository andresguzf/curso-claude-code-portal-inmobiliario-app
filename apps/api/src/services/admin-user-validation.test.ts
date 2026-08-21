import { describe, expect, it } from "vitest";

import { AUTH_LIMITS } from "@portal/contracts";

import { validateAdminUserUpdate } from "./admin-user-validation";

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
