import { describe, expect, it } from "vitest";

import {
  buildAdminInquiryWhere,
  parseAdminInquiryListQuery,
} from "./admin-inquiry-query";

function queryOf(queryString: string) {
  const result = parseAdminInquiryListQuery(new URLSearchParams(queryString));

  if (!result.ok) {
    throw new Error(`Se esperaba una consulta válida: ${result.message}`);
  }

  return result.query;
}

function rejectionOf(queryString: string): string {
  const result = parseAdminInquiryListQuery(new URLSearchParams(queryString));

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

describe("parseAdminInquiryListQuery", () => {
  it("acepta una URL sin parámetros", () => {
    expect(queryOf("")).toEqual({});
  });

  it("lee búsqueda y página", () => {
    expect(queryOf("search=ana&page=3")).toEqual({ search: "ana", page: 3 });
  });

  it("exige que la página sea un entero mayor que cero", () => {
    expect(rejectionOf("page=0")).toMatch(/entero mayor que cero/);
    expect(rejectionOf("page=1.5")).toMatch(/entero mayor que cero/);
  });

  it("rechaza una búsqueda desmedida", () => {
    expect(rejectionOf(`search=${"a".repeat(200)}`)).toMatch(
      /no puede superar/,
    );
  });
});

describe("buildAdminInquiryWhere", () => {
  it("no impone condiciones sin búsqueda", () => {
    expect(buildAdminInquiryWhere({})).toEqual({});
    expect(buildAdminInquiryWhere({ search: "   " })).toEqual({});
  });

  it("busca en las cuatro formas de recordar una consulta", () => {
    // Quién escribió, con qué email, qué dijo y sobre qué propiedad.
    const where = buildAdminInquiryWhere({ search: "ana" });

    expect(where.OR).toHaveLength(4);
  });

  it("no filtra las que su autor ocultó", () => {
    // Aquí se ven todas: es el motivo por el que aquel borrado es lógico.
    expect(buildAdminInquiryWhere({ search: "ana" })).not.toHaveProperty(
      "hiddenByUserAt",
    );
    expect(buildAdminInquiryWhere({})).not.toHaveProperty("hiddenByUserAt");
  });

  it("no filtra por el estado de la propiedad", () => {
    // Una consulta sobre una propiedad eliminada sigue siendo un contacto
    // comercial que hay que poder responder.
    const where = buildAdminInquiryWhere({});

    expect(where).not.toHaveProperty("property");
  });
});
