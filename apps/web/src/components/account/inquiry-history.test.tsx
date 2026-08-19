import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/api-client", () => ({ hideInquiry: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { InquiryHistory } from "./inquiry-history";

function buildInquiry(id: string, overrides = {}) {
  return {
    id,
    message: "¿Acepta crédito hipotecario?",
    createdAt: "2026-02-01T10:00:00.000Z",
    property: {
      id: "seed-property-01",
      title: "Casa en Las Condes",
      imageUrl: null,
      ...overrides,
    },
  };
}

function buildPage(overrides = {}) {
  return {
    data: [buildInquiry("c1")],
    total: 1,
    page: 1,
    pageSize: 6,
    ...overrides,
  };
}

describe("InquiryHistory", () => {
  it("muestra la propiedad, el mensaje y la fecha de cada consulta", () => {
    render(<InquiryHistory page={buildPage()} search="" />);

    expect(screen.getByText("Casa en Las Condes")).toBeVisible();
    expect(screen.getByText("¿Acepta crédito hipotecario?")).toBeVisible();
    expect(screen.getByText("1 de febrero de 2026")).toBeVisible();
  });

  it("enlaza cada registro con su propiedad", () => {
    render(<InquiryHistory page={buildPage()} search="" />);

    expect(
      screen.getByRole("link", { name: "Casa en Las Condes" }),
    ).toHaveAttribute("href", "/properties/seed-property-01");
  });

  it("ofrece quitar cada consulta del historial, nombrando la propiedad", () => {
    render(<InquiryHistory page={buildPage()} search="" />);

    expect(
      screen.getByRole("button", {
        name: "Quitar de mi historial la consulta sobre Casa en Las Condes",
      }),
    ).toBeInTheDocument();
  });

  it("no pagina cuando todo cabe en una página", () => {
    render(<InquiryHistory page={buildPage()} search="" />);

    expect(
      screen.queryByRole("navigation", { name: "Páginas de mis consultas" }),
    ).toBeNull();
  });

  it("indica en qué página se está y cuántas hay", () => {
    render(
      <InquiryHistory page={buildPage({ total: 13, page: 2 })} search="" />,
    );

    // 13 consultas de a 6 son tres páginas.
    expect(screen.getByText("Página 2 de 3")).toBeVisible();
  });

  it("enlaza a la página anterior y a la siguiente", () => {
    render(
      <InquiryHistory page={buildPage({ total: 13, page: 2 })} search="" />,
    );

    const navegacion = screen.getByRole("navigation", {
      name: "Páginas de mis consultas",
    });

    expect(
      within(navegacion).getByRole("link", { name: /Anteriores/ }),
    ).toHaveAttribute("href", "/account#propiedades-consultadas");
    expect(
      within(navegacion).getByRole("link", { name: /Siguientes/ }),
    ).toHaveAttribute("href", "/account?page=3#propiedades-consultadas");
  });

  it("conserva la búsqueda al cambiar de página", () => {
    render(
      <InquiryHistory
        page={buildPage({ total: 13, page: 1 })}
        search="piscina"
      />,
    );

    expect(screen.getByRole("link", { name: /Siguientes/ })).toHaveAttribute(
      "href",
      "/account?search=piscina&page=2#propiedades-consultadas",
    );
  });

  it("en el primer extremo no ofrece un enlace que no lleva a nada", () => {
    render(
      <InquiryHistory page={buildPage({ total: 13, page: 1 })} search="" />,
    );

    expect(screen.queryByRole("link", { name: /Anteriores/ })).toBeNull();
    expect(screen.getByText(/Anteriores/)).toBeVisible();
  });

  it("explica un historial vacío", () => {
    render(
      <InquiryHistory page={buildPage({ data: [], total: 0 })} search="" />,
    );

    expect(
      screen.getByText(/Todavía no has enviado ninguna consulta/),
    ).toBeVisible();
  });

  it("distingue «no hay ninguna» de «ninguna coincide»", () => {
    render(
      <InquiryHistory
        page={buildPage({ data: [], total: 0 })}
        search="quincho"
      />,
    );

    expect(
      screen.getByText("Ninguna de tus consultas coincide con «quincho»."),
    ).toBeVisible();
  });

  it("deja la búsqueda escrita en el campo", () => {
    render(<InquiryHistory page={buildPage()} search="piscina" />);

    expect(screen.getByLabelText("Buscar en mis consultas")).toHaveValue(
      "piscina",
    );
  });
});
