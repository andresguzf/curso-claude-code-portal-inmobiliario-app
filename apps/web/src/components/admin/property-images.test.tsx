import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { IMAGE_LIMITS, type PropertyImageDto } from "@portal/contracts";

const {
  uploadPropertyImage,
  reorderPropertyImages,
  makePropertyImagePrimary,
  deletePropertyImage,
  refresh,
} = vi.hoisted(() => ({
  uploadPropertyImage: vi.fn(),
  reorderPropertyImages: vi.fn(),
  makePropertyImagePrimary: vi.fn(),
  deletePropertyImage: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("@/lib/api-client", () => ({
  uploadPropertyImage,
  reorderPropertyImages,
  makePropertyImagePrimary,
  deletePropertyImage,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn() }),
}));

import { PropertyImages } from "./property-images";

function buildImage(
  index: number,
  overrides: Partial<PropertyImageDto> = {},
): PropertyImageDto {
  return {
    id: `img-${index}`,
    url: `https://res.cloudinary.com/x/image/upload/v1/foto-${index}.jpg`,
    publicId: `propiedades-claude/foto-${index}`,
    position: index,
    isPrimary: index === 0,
    ...overrides,
  };
}

const GALLERY = [buildImage(0), buildImage(1), buildImage(2)];

function renderGallery(images: readonly PropertyImageDto[] = GALLERY) {
  return render(<PropertyImages propertyId="prop-1" images={images} />);
}

/**
 * Elige archivos saltándose el filtro de `accept`.
 *
 * `accept` es una sugerencia del diálogo del sistema, no una barrera: quien
 * elige «todos los archivos» puede colar un PDF, y por eso la comprobación
 * del componente existe. `userEvent.upload` sí lo aplica, así que para
 * probarla hay que disparar el cambio a mano.
 */
function chooseFiles(files: readonly File[]) {
  fireEvent.change(screen.getByLabelText("Añadir imágenes"), {
    target: { files },
  });
}

/** Un archivo con el tipo y el tamaño que declara el navegador. */
function buildFile(name = "foto.jpg", type = "image/jpeg", size = 1024): File {
  const file = new File(["x"], name, { type });

  Object.defineProperty(file, "size", { value: size });

  return file;
}

afterEach(() => {
  for (const mock of [
    uploadPropertyImage,
    reorderPropertyImages,
    makePropertyImagePrimary,
    deletePropertyImage,
    refresh,
  ]) {
    mock.mockReset();
  }
});

describe("PropertyImages", () => {
  it("señala cuál es la portada", () => {
    renderGallery();

    expect(screen.getByText("Portada")).toBeVisible();
  });

  it("no ofrece hacer portada a la que ya lo es", () => {
    renderGallery();

    // Tres imágenes, pero solo dos pueden ascender.
    expect(
      screen.getAllByRole("button", { name: /Hacer portada/ }),
    ).toHaveLength(2);
  });

  it("avisa cuando la propiedad no tiene ninguna", () => {
    renderGallery([]);

    expect(
      screen.getByText("Esta propiedad todavía no tiene imágenes."),
    ).toBeVisible();
  });

  it("no deja retroceder la primera ni avanzar la última", () => {
    renderGallery();

    expect(
      screen.getByRole("button", {
        name: /Mover la imagen 1 de 3 hacia atrás/,
      }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", {
        name: /Mover la imagen 3 de 3 hacia adelante/,
      }),
    ).toBeDisabled();
  });

  it("envía la lista completa al reordenar, no el movimiento", async () => {
    const user = userEvent.setup();

    renderGallery();
    await user.click(
      screen.getByRole("button", {
        name: /Mover la imagen 3 de 3 hacia atrás/,
      }),
    );

    await waitFor(() => expect(reorderPropertyImages).toHaveBeenCalled());
    expect(reorderPropertyImages).toHaveBeenCalledWith("prop-1", [
      "img-0",
      "img-2",
      "img-1",
    ]);
  });

  it("marca la portada pedida", async () => {
    const user = userEvent.setup();

    renderGallery();
    await user.click(
      screen.getAllByRole("button", { name: /Hacer portada/ })[0],
    );

    await waitFor(() =>
      expect(makePropertyImagePrimary).toHaveBeenCalledWith("prop-1", "img-1"),
    );
  });

  it("no elimina nada hasta que se confirma", async () => {
    const user = userEvent.setup();

    renderGallery();
    await user.click(
      screen.getByRole("button", { name: /Eliminar la imagen 2 de 3/ }),
    );

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(deletePropertyImage).not.toHaveBeenCalled();
  });

  it("elimina al confirmar y repinta la ficha", async () => {
    const user = userEvent.setup();

    renderGallery();
    await user.click(
      screen.getByRole("button", { name: /Eliminar la imagen 2 de 3/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, eliminarla" }));

    await waitFor(() =>
      expect(deletePropertyImage).toHaveBeenCalledWith("prop-1", "img-1"),
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("sube los archivos elegidos", async () => {
    const user = userEvent.setup();

    uploadPropertyImage.mockResolvedValue(buildImage(3));

    renderGallery();
    await user.upload(screen.getByLabelText("Añadir imágenes"), [
      buildFile("una.jpg"),
      buildFile("otra.png", "image/png"),
    ]);

    await waitFor(() => expect(uploadPropertyImage).toHaveBeenCalledTimes(2));
    expect(refresh).toHaveBeenCalled();
  });

  it("rechaza en el navegador lo que el servidor rechazaría", async () => {
    // Así quien elige un archivo que no sirve lo sabe sin esperar la subida.
    renderGallery();
    chooseFiles([buildFile("documento.pdf", "application/pdf")]);

    expect(await screen.findByText(/«documento.pdf» no sirve/)).toBeVisible();
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("rechaza un archivo que supera el tamaño", async () => {
    const user = userEvent.setup();

    renderGallery();
    await user.upload(
      screen.getByLabelText("Añadir imágenes"),
      buildFile("enorme.jpg", "image/jpeg", IMAGE_LIMITS.maxBytes + 1),
    );

    expect(await screen.findByText(/«enorme.jpg» no sirve/)).toBeVisible();
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("no deja pasar del tope de la propiedad", async () => {
    const user = userEvent.setup();
    const casiLlena = Array.from(
      { length: IMAGE_LIMITS.maxImagesPerProperty - 1 },
      (_, index) => buildImage(index),
    );

    renderGallery(casiLlena);
    await user.upload(screen.getByLabelText("Añadir imágenes"), [
      buildFile("una.jpg"),
      buildFile("otra.jpg"),
    ]);

    expect(await screen.findByText(/Solo cabe/)).toBeVisible();
    expect(uploadPropertyImage).not.toHaveBeenCalled();
  });

  it("cierra la puerta cuando ya no caben más", () => {
    const llena = Array.from(
      { length: IMAGE_LIMITS.maxImagesPerProperty },
      (_, index) => buildImage(index),
    );

    renderGallery(llena);

    expect(screen.getByLabelText("Añadir imágenes")).toBeDisabled();
    expect(screen.getByText(/Máximo alcanzado/)).toBeVisible();
  });

  it("muestra el motivo que da el servidor", async () => {
    const user = userEvent.setup();

    deletePropertyImage.mockRejectedValue(new Error("Imagen no encontrada."));

    renderGallery();
    await user.click(
      screen.getByRole("button", { name: /Eliminar la imagen 2 de 3/ }),
    );
    await user.click(screen.getByRole("button", { name: "Sí, eliminarla" }));

    expect(await screen.findByText("Imagen no encontrada.")).toBeVisible();
  });
});
