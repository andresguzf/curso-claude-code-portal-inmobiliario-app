import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  buildDestroyUrl,
  buildUploadSignature,
  buildUploadUrl,
  CLOUDINARY_FOLDER,
  readCloudinaryConfig,
  readUploadedImage,
} from "./cloudinary";

describe("readCloudinaryConfig", () => {
  const COMPLETE = {
    CLOUDINARY_CLOUD_NAME: "portal",
    CLOUDINARY_API_KEY: "123",
    CLOUDINARY_API_SECRET: "secreto",
  };

  it("lee las tres credenciales", () => {
    expect(readCloudinaryConfig(COMPLETE)).toEqual({
      cloudName: "portal",
      apiKey: "123",
      apiSecret: "secreto",
    });
  });

  it("devuelve null si falta alguna", () => {
    // Es lo que distingue «no está configurado» de «Cloudinary falló».
    for (const missing of Object.keys(COMPLETE)) {
      const environment = { ...COMPLETE, [missing]: "" };

      expect(readCloudinaryConfig(environment)).toBeNull();
    }
  });

  it("no acepta una credencial de solo espacios", () => {
    expect(
      readCloudinaryConfig({ ...COMPLETE, CLOUDINARY_API_SECRET: "   " }),
    ).toBeNull();
  });
});

describe("buildUploadSignature", () => {
  it("ordena los parámetros alfabéticamente antes de firmar", () => {
    // Firmar en otro orden produce una firma que Cloudinary rechaza.
    const esperada = createHash("sha1")
      .update("folder=propiedades-claude&timestamp=1700000000secreto")
      .digest("hex");

    expect(
      buildUploadSignature(
        { timestamp: "1700000000", folder: CLOUDINARY_FOLDER },
        "secreto",
      ),
    ).toBe(esperada);
  });

  it("da la misma firma sin importar el orden en que se declaren", () => {
    const primera = buildUploadSignature({ a: "1", b: "2" }, "secreto");
    const segunda = buildUploadSignature({ b: "2", a: "1" }, "secreto");

    expect(primera).toBe(segunda);
  });

  it("cambia si cambia el secreto", () => {
    const conUno = buildUploadSignature({ timestamp: "1" }, "uno");
    const conOtro = buildUploadSignature({ timestamp: "1" }, "otro");

    expect(conUno).not.toBe(conOtro);
  });
});

describe("buildUploadUrl", () => {
  it("apunta a la cuenta configurada", () => {
    expect(buildUploadUrl("portal")).toBe(
      "https://api.cloudinary.com/v1_1/portal/image/upload",
    );
  });

  it("escapa el nombre de la cuenta", () => {
    expect(buildUploadUrl("mi cuenta")).toContain("mi%20cuenta");
  });

  it("distingue subir de eliminar", () => {
    expect(buildDestroyUrl("portal")).toBe(
      "https://api.cloudinary.com/v1_1/portal/image/destroy",
    );
  });
});

describe("readUploadedImage", () => {
  it("se queda con la URL segura y el identificador", () => {
    expect(
      readUploadedImage({
        url: "http://res.cloudinary.com/portal/image/upload/v1/x.jpg",
        secure_url: "https://res.cloudinary.com/portal/image/upload/v1/x.jpg",
        public_id: "propiedades-claude/x",
      }),
    ).toEqual({
      url: "https://res.cloudinary.com/portal/image/upload/v1/x.jpg",
      publicId: "propiedades-claude/x",
    });
  });

  it("prefiere https: una imagen por http marcaría la página como contenido mixto", () => {
    const leida = readUploadedImage({
      url: "http://ejemplo/x.jpg",
      secure_url: "https://ejemplo/x.jpg",
      public_id: "x",
    });

    expect(leida?.url.startsWith("https://")).toBe(true);
  });

  it("devuelve null ante una respuesta que no se puede interpretar", () => {
    expect(readUploadedImage(null)).toBeNull();
    expect(readUploadedImage("caída")).toBeNull();
    expect(
      readUploadedImage({ error: { message: "Invalid signature" } }),
    ).toBeNull();
    expect(readUploadedImage({ secure_url: "https://x" })).toBeNull();
    expect(readUploadedImage({ secure_url: "", public_id: "x" })).toBeNull();
  });
});
