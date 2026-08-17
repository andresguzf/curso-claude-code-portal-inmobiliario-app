import { describe, expect, it } from "vitest";

import {
  formatAge,
  formatArea,
  formatFullLocation,
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
  /** Espacio indivisible entre la cifra y la unidad. */
  const UNIT_SPACE = "\u00a0";

  it("a\u00f1ade la unidad de superficie", () => {
    expect(formatArea(180)).toBe(`180${UNIT_SPACE}m\u00b2`);
  });

  it("agrupa los miles", () => {
    expect(formatArea(5000)).toBe(`5.000${UNIT_SPACE}m\u00b2`);
  });

  it("separa cifra y unidad con espacio indivisible, para que «m\u00b2» no quede hu\u00e9rfano", () => {
    const formatted = formatArea(180) ?? "";

    expect(formatted).toContain(UNIT_SPACE);
    expect(formatted).not.toContain(" ");
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

describe("formatFullLocation", () => {
  it("encadena dirección, comuna, ciudad y región", () => {
    expect(
      formatFullLocation({
        address: "Avenida Apoquindo 3000",
        commune: "Las Condes",
        city: "Santiago",
        region: "Región Metropolitana",
      }),
    ).toBe(
      "Avenida Apoquindo 3000, Las Condes, Santiago, Región Metropolitana",
    );
  });

  it("no repite el tramo cuando comuna y ciudad coinciden", () => {
    expect(
      formatFullLocation({
        address: "Camino a Ensenada 8",
        commune: "Puerto Varas",
        city: "Puerto Varas",
        region: "Región de Los Lagos",
      }),
    ).toBe("Camino a Ensenada 8, Puerto Varas, Región de Los Lagos");
  });

  it("omite los tramos vacíos", () => {
    expect(
      formatFullLocation({
        address: "Agustinas 1120",
        commune: "Santiago",
        city: "Santiago",
        region: "",
      }),
    ).toBe("Agustinas 1120, Santiago");
  });
});

describe("formatAge", () => {
  it("expresa la antigüedad en años", () => {
    expect(formatAge(12)).toBe("12 años");
  });

  it("concuerda el singular", () => {
    expect(formatAge(1)).toBe("1 año");
  });

  it("llama nueva a una propiedad sin antigüedad, no «0 años»", () => {
    expect(formatAge(0)).toBe("Nueva");
  });

  it("devuelve null cuando la propiedad no declara antigüedad", () => {
    expect(formatAge(null)).toBeNull();
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
