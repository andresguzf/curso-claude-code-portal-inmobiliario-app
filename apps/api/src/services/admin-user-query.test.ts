import { describe, expect, it } from "vitest";

import {
  buildAdminUserWhere,
  parseAdminUserListQuery,
} from "./admin-user-query";

function queryOf(queryString: string) {
  const result = parseAdminUserListQuery(new URLSearchParams(queryString));

  if (!result.ok) {
    throw new Error(`Se esperaba una consulta válida: ${result.message}`);
  }

  return result.query;
}

function rejectionOf(queryString: string): string {
  const result = parseAdminUserListQuery(new URLSearchParams(queryString));

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result.message;
}

describe("parseAdminUserListQuery", () => {
  it("acepta una URL sin parámetros", () => {
    expect(queryOf("")).toEqual({});
  });

  it("lee rol y estado", () => {
    expect(queryOf("role=ADMIN&status=inactive")).toMatchObject({
      role: "ADMIN",
      status: "inactive",
    });
  });

  it("ignora un parámetro presente pero vacío", () => {
    // Es lo que deja un formulario enviado sin rellenar ese campo.
    expect(queryOf("role=&status=&search=")).toEqual({ search: "" });
  });

  it("rechaza un rol o un estado que no existen", () => {
    expect(rejectionOf("role=SUPERADMIN")).toBe("El rol pedido no es válido.");
    expect(rejectionOf("status=suspendido")).toBe(
      "El estado pedido no es válido.",
    );
  });

  it("exige que la página sea un entero mayor que cero", () => {
    expect(queryOf("page=2")).toMatchObject({ page: 2 });
    expect(rejectionOf("page=0")).toMatch(/entero mayor que cero/);
  });
});

describe("buildAdminUserWhere", () => {
  it("no impone condiciones sin filtros", () => {
    expect(buildAdminUserWhere({})).toEqual({});
  });

  it("busca en nombre y email", () => {
    const where = buildAdminUserWhere({ search: "ana" });

    expect(where.OR).toHaveLength(2);
  });

  it("ignora una búsqueda de solo espacios", () => {
    expect(buildAdminUserWhere({ search: "   " })).toEqual({});
  });

  it("traduce el estado a la columna booleana", () => {
    expect(buildAdminUserWhere({ status: "active" })).toMatchObject({
      isActive: true,
    });
    expect(buildAdminUserWhere({ status: "inactive" })).toMatchObject({
      isActive: false,
    });
  });

  it("no filtra por estado cuando se piden todos", () => {
    expect(buildAdminUserWhere({ status: "all" })).not.toHaveProperty(
      "isActive",
    );
  });

  it("combina rol, estado y búsqueda", () => {
    const where = buildAdminUserWhere({
      search: "ana",
      role: "USER",
      status: "active",
    });

    expect(Object.keys(where).sort()).toEqual(["OR", "isActive", "role"]);
  });
});
