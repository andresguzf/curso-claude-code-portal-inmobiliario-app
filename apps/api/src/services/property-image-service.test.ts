import { afterEach, describe, expect, it, vi } from "vitest";

import { IMAGE_LIMITS } from "@portal/contracts";

const propertyRepository = vi.hoisted(() => ({
  findAdminPropertyById: vi.fn(),
  findAdminProperties: vi.fn(),
  createProperty: vi.fn(),
  updateProperty: vi.fn(),
  markPropertyAsDeleted: vi.fn(),
}));

const imageRepository = vi.hoisted(() => ({
  countPropertyImages: vi.fn(),
  findNextImagePosition: vi.fn(),
  createPropertyImage: vi.fn(),
  findPropertyImage: vi.fn(),
  findPropertyImages: vi.fn(),
  reorderPropertyImages: vi.fn(),
  setPrimaryPropertyImage: vi.fn(),
  deletePropertyImage: vi.fn(),
}));

const cloudinary = vi.hoisted(() => ({
  readCloudinaryConfig: vi.fn(),
  uploadImage: vi.fn(),
  destroyImage: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/repositories/admin-property-repository", () => propertyRepository);
vi.mock("@/repositories/property-image-repository", () => imageRepository);
vi.mock("@/services/cloudinary", () => cloudinary);

import {
  addPropertyImage,
  makeImagePrimary,
  removeImage,
  reorderImages,
} from "./property-image-service";

/** Galería de tres imágenes, con la primera de portada. */
function buildGallery() {
  return [
    { id: "img-1", publicId: "cl/1", position: 0, isPrimary: true },
    { id: "img-2", publicId: "cl/2", position: 1, isPrimary: false },
    { id: "img-3", publicId: "cl/3", position: 2, isPrimary: false },
  ];
}

const CONFIG = { cloudName: "portal", apiKey: "1", apiSecret: "s" };

const UPLOADED = {
  url: "https://res.cloudinary.com/portal/image/upload/v1/x.jpg",
  publicId: "propiedades-claude/x",
};

/** Un archivo con el tipo y el tamaño que declara el navegador. */
function buildFile(type = "image/jpeg", size = 1024): File {
  return new File([new Uint8Array(size)], "foto.jpg", { type });
}

/** Camino feliz: propiedad existente, sin imágenes y con credenciales. */
function arrangeHappyPath() {
  propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "prop-1" });
  imageRepository.countPropertyImages.mockResolvedValue(0);
  imageRepository.findNextImagePosition.mockResolvedValue(0);
  cloudinary.readCloudinaryConfig.mockReturnValue(CONFIG);
  cloudinary.uploadImage.mockResolvedValue(UPLOADED);
  imageRepository.createPropertyImage.mockImplementation(
    async (image: Record<string, unknown>) => ({ id: "img-1", ...image }),
  );
}

afterEach(() => {
  for (const mock of [
    ...Object.values(propertyRepository),
    ...Object.values(imageRepository),
    ...Object.values(cloudinary),
  ]) {
    mock.mockReset();
  }
});

describe("addPropertyImage", () => {
  it("guarda la URL y el identificador que devuelve Cloudinary", async () => {
    arrangeHappyPath();

    const outcome = await addPropertyImage("prop-1", buildFile());

    expect(outcome).toMatchObject({
      status: "ok",
      image: { url: UPLOADED.url, publicId: UPLOADED.publicId },
    });
  });

  it("marca como principal la primera imagen de la propiedad", async () => {
    // Una propiedad sin portada no se pintaría en el catálogo.
    arrangeHappyPath();

    await addPropertyImage("prop-1", buildFile());

    expect(imageRepository.createPropertyImage).toHaveBeenCalledWith(
      expect.objectContaining({ isPrimary: true, position: 0 }),
    );
  });

  it("no marca como principal a las siguientes", async () => {
    arrangeHappyPath();
    imageRepository.findNextImagePosition.mockResolvedValue(3);

    await addPropertyImage("prop-1", buildFile());

    expect(imageRepository.createPropertyImage).toHaveBeenCalledWith(
      expect.objectContaining({ isPrimary: false, position: 3 }),
    );
  });

  it("responde «no encontrada» sin gastar una subida", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue(null);

    const outcome = await addPropertyImage("prop-borrada", buildFile());

    expect(outcome).toEqual({ status: "not-found" });
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it("rechaza un archivo inválido antes de subirlo", async () => {
    arrangeHappyPath();

    const outcome = await addPropertyImage(
      "prop-1",
      buildFile("application/pdf"),
    );

    expect(outcome.status).toBe("invalid");
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it("distingue el exceso de tamaño, que tiene su propio código", async () => {
    arrangeHappyPath();

    const outcome = await addPropertyImage(
      "prop-1",
      buildFile("image/jpeg", IMAGE_LIMITS.maxBytes + 1),
    );

    expect(outcome.status).toBe("too-large");
  });

  it("respeta el tope de imágenes por propiedad", async () => {
    arrangeHappyPath();
    imageRepository.countPropertyImages.mockResolvedValue(
      IMAGE_LIMITS.maxImagesPerProperty,
    );

    const outcome = await addPropertyImage("prop-1", buildFile());

    expect(outcome.status).toBe("invalid");
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it("avisa cuando el entorno no tiene credenciales", async () => {
    // No es lo mismo que «Cloudinary falló»: aquí no hay nada que reintentar.
    arrangeHappyPath();
    cloudinary.readCloudinaryConfig.mockReturnValue(null);

    const outcome = await addPropertyImage("prop-1", buildFile());

    expect(outcome).toEqual({ status: "not-configured" });
    expect(cloudinary.uploadImage).not.toHaveBeenCalled();
  });

  it("avisa cuando Cloudinary rechaza la subida", async () => {
    arrangeHappyPath();
    cloudinary.uploadImage.mockResolvedValue(null);

    const outcome = await addPropertyImage("prop-1", buildFile());

    expect(outcome).toEqual({ status: "upload-failed" });
    expect(imageRepository.createPropertyImage).not.toHaveBeenCalled();
  });

  it("borra de Cloudinary lo que no llegó a guardarse", async () => {
    // Sin esto quedaría un archivo que nada referencia y que nadie sabría
    // que sobra.
    arrangeHappyPath();
    imageRepository.createPropertyImage.mockRejectedValue(
      new Error("la base falló"),
    );

    await expect(addPropertyImage("prop-1", buildFile())).rejects.toThrow(
      "la base falló",
    );
    expect(cloudinary.destroyImage).toHaveBeenCalledWith(
      UPLOADED.publicId,
      CONFIG,
    );
  });
});

describe("reorderImages", () => {
  it("guarda el orden pedido", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImages.mockResolvedValue(buildGallery());

    const outcome = await reorderImages("p", ["img-3", "img-1", "img-2"]);

    expect(outcome).toEqual({ status: "ok" });
    expect(imageRepository.reorderPropertyImages).toHaveBeenCalledWith("p", [
      "img-3",
      "img-1",
      "img-2",
    ]);
  });

  it("rechaza una lista incompleta", async () => {
    // Dejaría posiciones a medias, y no hay forma de adivinar dónde va lo
    // que falta.
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImages.mockResolvedValue(buildGallery());

    const outcome = await reorderImages("p", ["img-1", "img-2"]);

    expect(outcome.status).toBe("invalid");
    expect(imageRepository.reorderPropertyImages).not.toHaveBeenCalled();
  });

  it("rechaza una imagen de otra propiedad", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImages.mockResolvedValue(buildGallery());

    const outcome = await reorderImages("p", ["img-1", "img-2", "ajena"]);

    expect(outcome.status).toBe("invalid");
    expect(imageRepository.reorderPropertyImages).not.toHaveBeenCalled();
  });

  it("rechaza identificadores repetidos", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImages.mockResolvedValue(buildGallery());

    const outcome = await reorderImages("p", ["img-1", "img-1", "img-2"]);

    expect(outcome.status).toBe("invalid");
    expect(imageRepository.reorderPropertyImages).not.toHaveBeenCalled();
  });

  it("responde «no encontrada» sobre una propiedad eliminada", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue(null);

    expect(await reorderImages("p", ["img-1"])).toEqual({
      status: "not-found",
    });
  });
});

describe("makeImagePrimary", () => {
  it("marca la imagen pedida", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImage.mockResolvedValue(buildGallery()[1]);

    const outcome = await makeImagePrimary("p", "img-2");

    expect(outcome).toEqual({ status: "ok" });
    expect(imageRepository.setPrimaryPropertyImage).toHaveBeenCalledWith(
      "p",
      "img-2",
    );
  });

  it("no deja marcar una imagen de otra propiedad", async () => {
    // El repositorio acota la búsqueda a la propiedad, así que no aparece.
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImage.mockResolvedValue(null);

    const outcome = await makeImagePrimary("p", "ajena");

    expect(outcome).toEqual({ status: "not-found" });
    expect(imageRepository.setPrimaryPropertyImage).not.toHaveBeenCalled();
  });
});

describe("removeImage", () => {
  function arrangeRemoval(image = buildGallery()[1]) {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImage.mockResolvedValue(image);
    imageRepository.findPropertyImages.mockResolvedValue(buildGallery());
    cloudinary.readCloudinaryConfig.mockReturnValue(CONFIG);
    cloudinary.destroyImage.mockResolvedValue(true);
  }

  it("borra la fila antes que el archivo", async () => {
    // Al revés, un fallo al borrar la fila dejaría una imagen rota en la
    // ficha; en este orden lo peor que queda es un archivo huérfano.
    arrangeRemoval();

    const order: string[] = [];

    imageRepository.deletePropertyImage.mockImplementation(async () => {
      order.push("fila");
    });
    cloudinary.destroyImage.mockImplementation(async () => {
      order.push("archivo");

      return true;
    });

    await removeImage("p", "img-2");

    expect(order).toEqual(["fila", "archivo"]);
  });

  it("asciende a la siguiente cuando se elimina la portada", async () => {
    // Sin principal, la propiedad no se pintaría en el catálogo.
    arrangeRemoval(buildGallery()[0]);

    await removeImage("p", "img-1");

    expect(imageRepository.deletePropertyImage).toHaveBeenCalledWith(
      "p",
      expect.objectContaining({ id: "img-1" }),
      "img-2",
    );
  });

  it("no asciende a nadie al eliminar una que no era la portada", async () => {
    arrangeRemoval();

    await removeImage("p", "img-2");

    expect(imageRepository.deletePropertyImage).toHaveBeenCalledWith(
      "p",
      expect.objectContaining({ id: "img-2" }),
      "img-1",
    );
  });

  it("no busca sucesora si era la única imagen", async () => {
    arrangeRemoval(buildGallery()[0]);
    imageRepository.findPropertyImages.mockResolvedValue([buildGallery()[0]]);

    await removeImage("p", "img-1");

    expect(imageRepository.deletePropertyImage).toHaveBeenCalledWith(
      "p",
      expect.objectContaining({ id: "img-1" }),
      null,
    );
  });

  it("da la operación por buena aunque Cloudinary falle", async () => {
    // Para quien administra, la imagen ya no está: es lo que pidió. El
    // archivo huérfano queda anotado en el log del servidor.
    arrangeRemoval();
    cloudinary.destroyImage.mockResolvedValue(false);

    expect(await removeImage("p", "img-2")).toEqual({ status: "ok" });
  });

  it("elimina la fila aunque el entorno no tenga credenciales", async () => {
    arrangeRemoval();
    cloudinary.readCloudinaryConfig.mockReturnValue(null);

    expect(await removeImage("p", "img-2")).toEqual({ status: "ok" });
    expect(imageRepository.deletePropertyImage).toHaveBeenCalled();
    expect(cloudinary.destroyImage).not.toHaveBeenCalled();
  });

  it("responde «no encontrada» ante una imagen que no es de la propiedad", async () => {
    propertyRepository.findAdminPropertyById.mockResolvedValue({ id: "p" });
    imageRepository.findPropertyImage.mockResolvedValue(null);

    expect(await removeImage("p", "ajena")).toEqual({ status: "not-found" });
    expect(imageRepository.deletePropertyImage).not.toHaveBeenCalled();
  });
});
