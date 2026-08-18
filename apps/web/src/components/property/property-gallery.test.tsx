import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { PropertyImageDto } from "@portal/contracts";

import { PropertyGallery } from "./property-gallery";

function buildImages(count: number): PropertyImageDto[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `image-${index + 1}`,
    url: `https://picsum.photos/seed/foto-${index + 1}/1200/800`,
    publicId: `seed/foto-${index + 1}`,
    position: index,
    isPrimary: index === 0,
  }));
}

function renderGallery(count: number) {
  return render(
    <PropertyGallery
      images={buildImages(count)}
      propertyTitle="Casa en Las Condes"
    />,
  );
}

/** La imagen grande es la única que lleva texto alternativo descriptivo. */
function mainImage() {
  return screen.getByRole("img", { name: /^Fotografía \d+ de \d+/ });
}

describe("PropertyGallery — sin fotografías", () => {
  it("avisa en lugar de dejar un hueco vacío", () => {
    render(<PropertyGallery images={[]} propertyTitle="Terreno" />);

    expect(
      screen.getByText("Esta propiedad todavía no tiene fotografías"),
    ).toBeVisible();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("PropertyGallery — una sola fotografía", () => {
  it("muestra la imagen sin controles de navegación", () => {
    renderGallery(1);

    expect(mainImage()).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Fotografía siguiente" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Fotografía anterior" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});

describe("PropertyGallery — varias fotografías", () => {
  it("empieza por la primera y describe su posición en el conjunto", () => {
    renderGallery(4);

    expect(mainImage()).toHaveAttribute(
      "alt",
      "Fotografía 1 de 4 de Casa en Las Condes",
    );
    expect(screen.getByText("1 / 4")).toBeVisible();
  });

  it("ofrece una miniatura por fotografía", () => {
    renderGallery(4);

    expect(
      within(screen.getByRole("list")).getAllByRole("listitem"),
    ).toHaveLength(4);
  });

  it("marca la miniatura activa y solo esa", () => {
    renderGallery(4);

    const activas = screen
      .getAllByRole("button", { name: /Ver fotografía/ })
      .filter((boton) => boton.getAttribute("aria-current") === "true");

    expect(activas).toHaveLength(1);
    expect(activas[0]).toHaveAccessibleName("Ver fotografía 1 de 4");
  });

  it("avanza y retrocede con los botones laterales", async () => {
    const user = userEvent.setup();
    renderGallery(4);

    await user.click(
      screen.getByRole("button", { name: "Fotografía siguiente" }),
    );
    expect(screen.getByText("2 / 4")).toBeVisible();

    await user.click(
      screen.getByRole("button", { name: "Fotografía anterior" }),
    );
    expect(screen.getByText("1 / 4")).toBeVisible();
  });

  it("da la vuelta en ambos extremos", async () => {
    const user = userEvent.setup();
    renderGallery(3);

    // Desde la primera, retroceder lleva a la última.
    await user.click(
      screen.getByRole("button", { name: "Fotografía anterior" }),
    );
    expect(screen.getByText("3 / 3")).toBeVisible();

    // Y avanzar desde la última vuelve a la primera.
    await user.click(
      screen.getByRole("button", { name: "Fotografía siguiente" }),
    );
    expect(screen.getByText("1 / 3")).toBeVisible();
  });

  it("salta a la fotografía elegida desde su miniatura", async () => {
    const user = userEvent.setup();
    renderGallery(4);

    await user.click(
      screen.getByRole("button", { name: "Ver fotografía 3 de 4" }),
    );

    expect(screen.getByText("3 / 4")).toBeVisible();
    expect(mainImage()).toHaveAttribute(
      "alt",
      "Fotografía 3 de 4 de Casa en Las Condes",
    );
  });

  it("se recorre con las flechas del teclado", async () => {
    const user = userEvent.setup();
    renderGallery(4);

    await user.click(
      screen.getByRole("button", { name: "Fotografía siguiente" }),
    );
    await user.keyboard("{ArrowRight}");
    expect(screen.getByText("3 / 4")).toBeVisible();

    await user.keyboard("{ArrowLeft}");
    expect(screen.getByText("2 / 4")).toBeVisible();
  });

  it("anuncia el cambio a los lectores de pantalla", async () => {
    const user = userEvent.setup();
    const { container } = renderGallery(4);

    const anuncio = container.querySelector('[aria-live="polite"]');
    expect(anuncio).toHaveTextContent("Fotografía 1 de 4");

    await user.click(
      screen.getByRole("button", { name: "Fotografía siguiente" }),
    );

    expect(anuncio).toHaveTextContent("Fotografía 2 de 4");
  });

  it("no repite la descripción en las miniaturas decorativas", () => {
    renderGallery(4);

    // Solo la imagen grande tiene texto alternativo; las miniaturas lo llevan
    // vacío y su nombre lo aporta el botón que las contiene.
    expect(screen.getAllByRole("img")).toHaveLength(1);
  });
});
