import { describe, expect, it } from "vitest";

import {
  formatArea,
  formatOperationType,
  formatPropertyPrice,
  formatPropertyType,
  formatShortLocation,
} from "./format";

describe("formatPropertyPrice", () => {
  it("agrupa los miles y omite decimales", () => {
    const formatted = formatPropertyPrice(890000, "USD", "SALE");

    expect(formatted).toContain("890.000");
    expect(formatted).not.toContain(",00");
  });

  it("marca el precio de arriendo como mensual", () => {
    expect(formatPropertyPrice(1800, "USD", "RENT")).toMatch(/\/mes$/);
  });

  it("no marca como mensual el precio de venta", () => {
    expect(formatPropertyPrice(890000, "USD", "SALE")).not.toContain("/mes");
  });

  it("indica la moneda", () => {
    expect(formatPropertyPrice(1000, "USD", "SALE")).toMatch(/US\$|\$/);
  });
});

describe("formatArea", () => {
  it("añade la unidad de superficie", () => {
    expect(formatArea(180)).toBe("180 m²");
  });

  it("agrupa los miles", () => {
    expect(formatArea(5000)).toBe("5.000 m²");
  });

  it("devuelve null cuando la propiedad no declara superficie", () => {
    expect(formatArea(null)).toBeNull();
  });
});

describe("formatShortLocation", () => {
  it("muestra comuna y ciudad", () => {
    expect(formatShortLocation("Las Condes", "Santiago")).toBe(
      "Las Condes, Santiago",
    );
  });

  it("no repite el nombre cuando comuna y ciudad coinciden", () => {
    expect(formatShortLocation("Puerto Varas", "Puerto Varas")).toBe(
      "Puerto Varas",
    );
  });
});

describe("etiquetas del dominio", () => {
  it("traduce los tipos de operación", () => {
    expect(formatOperationType("SALE")).toBe("Venta");
    expect(formatOperationType("RENT")).toBe("Arriendo");
  });

  it("traduce todos los tipos de propiedad", () => {
    expect(formatPropertyType("HOUSE")).toBe("Casa");
    expect(formatPropertyType("APARTMENT")).toBe("Departamento");
    expect(formatPropertyType("LAND")).toBe("Terreno");
    expect(formatPropertyType("OFFICE")).toBe("Oficina");
    expect(formatPropertyType("COMMERCIAL")).toBe("Local comercial");
    expect(formatPropertyType("OTHER")).toBe("Otro");
  });
});
