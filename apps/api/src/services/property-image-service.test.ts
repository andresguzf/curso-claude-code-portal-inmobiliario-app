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

import { addPropertyImage } from "./property-image-service";

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
