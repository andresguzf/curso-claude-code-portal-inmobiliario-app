import { describe, expect, it } from "vitest";

import {
  validateAccountUpdate,
  validateLogin,
  validateRegister,
} from "./auth-validation";

const VALID_REGISTER = {
  name: "Ana Pérez",
  email: "ana@example.com",
  password: "una contraseña larga",
};

function rejectionOf(
  validate: (payload: unknown) => { ok: boolean; message?: string },
  payload: unknown,
): string {
  const result = validate(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo y fue aceptado");
  }

  return result.message ?? "";
}

describe("validateRegister", () => {
  it("acepta un registro completo", () => {
    expect(validateRegister(VALID_REGISTER)).toEqual({
      ok: true,
      value: VALID_REGISTER,
    });
  });

  it("recorta el nombre y el email, pero no la contraseña", () => {
    const result = validateRegister({
      name: "  Ana Pérez  ",
      email: " ana@example.com ",
      password: "  con espacios  ",
    });

    // Recortar la contraseña cambiaría en silencio lo que se escribió.
    expect(result).toEqual({
      ok: true,
      value: {
        name: "Ana Pérez",
        email: "ana@example.com",
        password: "  con espacios  ",
      },
    });
  });

  it("exige nombre y email válidos", () => {
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, name: "" }),
    ).toContain("nombre");
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, email: "ana" }),
    ).toContain("email");
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, email: "" }),
    ).toContain("email");
  });

  it("exige una contraseña de al menos ocho caracteres", () => {
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, password: "corta7c" }),
    ).toContain("al menos 8");
  });

  it("rechaza una contraseña desmedida, que solo daría trabajo al servidor", () => {
    expect(
      rejectionOf(validateRegister, {
        ...VALID_REGISTER,
        password: "a".repeat(201),
      }),
    ).toContain("larga");
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    expect(rejectionOf(validateRegister, null)).toContain("inválido");
    expect(rejectionOf(validateRegister, "texto")).toContain("inválido");
  });

  it("ignora los campos que no son texto", () => {
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, name: 42 }),
    ).toContain("nombre");
    expect(
      rejectionOf(validateRegister, { ...VALID_REGISTER, password: 12345678 }),
    ).toContain("al menos 8");
  });
});

describe("validateLogin", () => {
  it("acepta unas credenciales presentes", () => {
    expect(
      validateLogin({ email: " ana@example.com ", password: "cualquiera" }),
    ).toEqual({
      ok: true,
      value: { email: "ana@example.com", password: "cualquiera" },
    });
  });

  it("no comprueba el formato del email ni el largo de la contraseña", () => {
    // Rechazar aquí por formato revelaría qué correos son plausibles, y
    // además impediría entrar a quien se registró con reglas anteriores.
    expect(validateLogin({ email: "ana", password: "1" }).ok).toBe(true);
  });

  it("exige que ambos campos vengan", () => {
    expect(rejectionOf(validateLogin, { email: "", password: "x" })).toContain(
      "obligatorios",
    );
    expect(
      rejectionOf(validateLogin, { email: "ana", password: "" }),
    ).toContain("obligatorios");
  });
});

describe("validateAccountUpdate", () => {
  const VALID_UPDATE = {
    name: "Ana Pérez",
    email: "ana@example.com",
    currentPassword: "la de siempre",
  };

  it("acepta un cambio de nombre y email", () => {
    expect(validateAccountUpdate(VALID_UPDATE)).toEqual({
      ok: true,
      value: VALID_UPDATE,
    });
  });

  it("acepta además una contraseña nueva", () => {
    expect(
      validateAccountUpdate({ ...VALID_UPDATE, newPassword: "otra distinta" }),
    ).toMatchObject({ ok: true, value: { newPassword: "otra distinta" } });
  });

  it("exige la contraseña actual incluso para cambiar solo el nombre", () => {
    // Regla única: cualquier cambio pide demostrar que se es el dueño.
    expect(
      rejectionOf(validateAccountUpdate, {
        ...VALID_UPDATE,
        currentPassword: "",
      }),
    ).toContain("contraseña actual");
  });

  it("trata una contraseña nueva vacía como «no cambiarla»", () => {
    // Y no como «dejarla en blanco».
    expect(validateAccountUpdate({ ...VALID_UPDATE, newPassword: "" })).toEqual(
      { ok: true, value: VALID_UPDATE },
    );
  });

  it("aplica el mínimo de largo a la contraseña nueva", () => {
    expect(
      rejectionOf(validateAccountUpdate, {
        ...VALID_UPDATE,
        newPassword: "corta7c",
      }),
    ).toContain("al menos 8");
  });

  it("descarta el rol y el estado aunque lleguen en el cuerpo", () => {
    const result = validateAccountUpdate({
      ...VALID_UPDATE,
      role: "ADMIN",
      isActive: false,
    });

    expect(result).toEqual({ ok: true, value: VALID_UPDATE });
  });

  it("exige nombre y email válidos", () => {
    expect(
      rejectionOf(validateAccountUpdate, { ...VALID_UPDATE, name: "" }),
    ).toContain("nombre");
    expect(
      rejectionOf(validateAccountUpdate, { ...VALID_UPDATE, email: "ana" }),
    ).toContain("email");
  });
});
