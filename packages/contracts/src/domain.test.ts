import { describe, expect, it } from "vitest";

import { Currency, OperationType, PropertyType, UserRole } from "./domain";

/**
 * Estas pruebas fijan los valores exigidos por `spec.md`. Si alguien renombra
 * o elimina un valor, el fallo aparece aquí y no en producción a través de
 * una URL de filtro que deja de funcionar.
 */
describe("vocabulario del dominio", () => {
  it("define los tipos de operación de la especificación", () => {
    expect(Object.values(OperationType)).toEqual(["SALE", "RENT"]);
  });

  it("define los tipos de propiedad de la especificación", () => {
    expect(Object.values(PropertyType)).toEqual([
      "HOUSE",
      "APARTMENT",
      "LAND",
      "OFFICE",
      "COMMERCIAL",
      "OTHER",
    ]);
  });

  it("soporta la moneda USD", () => {
    expect(Object.values(Currency)).toContain("USD");
  });

  it("define los roles USER y ADMIN", () => {
    expect(Object.values(UserRole)).toEqual(["USER", "ADMIN"]);
  });
});
