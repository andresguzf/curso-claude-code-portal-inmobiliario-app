import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { buildPropertySummary } from "@/test-support/property-fixtures";

import { PropertyGrid } from "./property-grid";

const properties = [
  buildPropertySummary({ id: "a", title: "Casa en Las Condes" }),
  buildPropertySummary({ id: "b", title: "Departamento en Ñuñoa" }),
  buildPropertySummary({ id: "c", title: "Terreno en Puerto Varas" }),
  buildPropertySummary({ id: "d", title: "Oficina en Providencia" }),
];

describe("PropertyGrid", () => {
  it("presenta las propiedades como una lista", () => {
    render(<PropertyGrid properties={properties} />);

    const list = screen.getByRole("list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(4);
  });

  it("renderiza una tarjeta por propiedad", () => {
    render(<PropertyGrid properties={properties} />);

    for (const property of properties) {
      expect(
        screen.getByRole("heading", { level: 3, name: property.title }),
      ).toBeVisible();
    }
  });

  it("renderiza una lista vacía sin fallar", () => {
    render(<PropertyGrid properties={[]} />);

    expect(screen.getByRole("list")).toBeEmptyDOMElement();
  });

  it("apila en móvil y reparte en dos y tres columnas al crecer", () => {
    render(<PropertyGrid properties={properties} />);

    const list = screen.getByRole("list");

    expect(list).toHaveClass("grid-cols-1");
    expect(list).toHaveClass("sm:grid-cols-2");
    expect(list).toHaveClass("lg:grid-cols-3");
  });

  it("acepta clases adicionales sin perder la cuadrícula", () => {
    render(<PropertyGrid properties={properties} className="mt-8" />);

    const list = screen.getByRole("list");

    expect(list).toHaveClass("mt-8");
    expect(list).toHaveClass("grid-cols-1");
  });

  it("prioriza solo las primeras imágenes cuando se le pide", () => {
    render(<PropertyGrid properties={properties} prioritizeFirstImages />);

    const images = screen.getAllByRole("img");

    expect(images).toHaveLength(4);
    // `next/image` traduce `priority` a fetchpriority/loading en el <img>.
    expect(images[3]).toHaveAttribute("loading", "lazy");
    expect(images[0]).not.toHaveAttribute("loading", "lazy");
  });

  it("no prioriza ninguna imagen por omisión", () => {
    render(<PropertyGrid properties={properties} />);

    for (const image of screen.getAllByRole("img")) {
      expect(image).toHaveAttribute("loading", "lazy");
    }
  });
});
