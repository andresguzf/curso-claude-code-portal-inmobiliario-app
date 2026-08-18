import { describe, expect, it } from "vitest";

import { validateInquiry } from "./inquiry-validation";

const VALID_INQUIRY = {
  propertyId: "seed-property-01",
  name: "Ana Pérez",
  email: "ana@example.com",
  phone: "+56 9 1234 5678",
  message: "Me interesa esta propiedad, ¿podemos coordinar una visita?",
};

function expectRejection(payload: unknown): string {
  const result = validateInquiry(payload);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo y la consulta fue aceptada");
  }

  return result.message;
}

describe("validateInquiry", () => {
  it("acepta una consulta completa", () => {
    const result = validateInquiry(VALID_INQUIRY);

    expect(result).toEqual({ ok: true, inquiry: VALID_INQUIRY });
  });

  it("acepta una consulta sin teléfono", () => {
    const result = validateInquiry({ ...VALID_INQUIRY, phone: undefined });

    expect(result).toMatchObject({ ok: true, inquiry: { phone: undefined } });
  });

  it("recorta los espacios sobrantes", () => {
    const result = validateInquiry({
      ...VALID_INQUIRY,
      name: "  Ana Pérez  ",
      email: " ana@example.com ",
    });

    expect(result).toMatchObject({
      ok: true,
      inquiry: { name: "Ana Pérez", email: "ana@example.com" },
    });
  });

  it("trata un teléfono en blanco como ausente", () => {
    const result = validateInquiry({ ...VALID_INQUIRY, phone: "   " });

    expect(result).toMatchObject({ ok: true, inquiry: { phone: undefined } });
  });

  it("exige la propiedad consultada", () => {
    expect(expectRejection({ ...VALID_INQUIRY, propertyId: "" })).toContain(
      "propiedad",
    );
  });

  it("exige nombre, email y mensaje", () => {
    expect(expectRejection({ ...VALID_INQUIRY, name: "" })).toContain("nombre");
    expect(expectRejection({ ...VALID_INQUIRY, email: "" })).toContain("email");
    expect(expectRejection({ ...VALID_INQUIRY, message: "" })).toContain(
      "mensaje",
    );
  });

  it("rechaza un email sin forma de email", () => {
    expect(expectRejection({ ...VALID_INQUIRY, email: "ana" })).toContain(
      "email",
    );
    expect(
      expectRejection({ ...VALID_INQUIRY, email: "ana@sin-dominio" }),
    ).toContain("email");
  });

  it("rechaza un mensaje demasiado corto para ser una consulta", () => {
    expect(expectRejection({ ...VALID_INQUIRY, message: "Hola" })).toContain(
      "al menos",
    );
  });

  it("rechaza los campos que superan las cotas", () => {
    expect(
      expectRejection({ ...VALID_INQUIRY, name: "a".repeat(121) }),
    ).toContain("largo");
    expect(
      expectRejection({ ...VALID_INQUIRY, phone: "9".repeat(33) }),
    ).toContain("largo");
    expect(
      expectRejection({ ...VALID_INQUIRY, message: "a".repeat(1001) }),
    ).toContain("largo");
  });

  it("rechaza un cuerpo que no es un objeto", () => {
    expect(expectRejection(null)).toContain("inválido");
    expect(expectRejection("texto suelto")).toContain("inválido");
  });

  it("ignora los campos que no son texto en lugar de reventar", () => {
    expect(expectRejection({ ...VALID_INQUIRY, name: 42 })).toContain("nombre");
  });
});
