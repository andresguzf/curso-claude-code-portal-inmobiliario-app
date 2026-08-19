import { describe, expect, it } from "vitest";

import { validateLogin, validateRegister } from "./auth-validation";

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
