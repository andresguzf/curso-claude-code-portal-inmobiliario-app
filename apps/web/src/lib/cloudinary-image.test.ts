import { describe, expect, it } from "vitest";

import { buildCloudinaryUrl, isCloudinaryUrl } from "./cloudinary-image";

const CLOUDINARY =
  "https://res.cloudinary.com/portal/image/upload/v1787/propiedades-claude/foto.jpg";

describe("isCloudinaryUrl", () => {
  it("reconoce una URL de entrega de Cloudinary", () => {
    expect(isCloudinaryUrl(CLOUDINARY)).toBe(true);
  });

  it("no confunde otras imágenes remotas", () => {
    // Estas siguen pasando por el optimizador de Next.
    expect(isCloudinaryUrl("https://picsum.photos/seed/x/1200/800")).toBe(
      false,
    );
    expect(isCloudinaryUrl("https://images.unsplash.com/photo-1")).toBe(false);
  });

  it("no acepta un dominio que solo empiece parecido", () => {
    expect(
      isCloudinaryUrl("https://res.cloudinary.com.ejemplo.cl/image/upload/x"),
    ).toBe(false);
  });

  it("exige el segmento de subida, no cualquier ruta", () => {
    expect(isCloudinaryUrl("https://res.cloudinary.com/portal/raw/x.pdf")).toBe(
      false,
    );
  });
});

describe("buildCloudinaryUrl", () => {
  it("pide el formato y la compresión automáticos", () => {
    const url = buildCloudinaryUrl({ src: CLOUDINARY, width: 640 });

    expect(url).toContain("/image/upload/f_auto,q_auto,c_limit,w_640/");
  });

  it("reduce pero no amplía", () => {
    // `c_limit`: una foto subida a 800px no se estira a 1200 y se ve borrosa.
    expect(buildCloudinaryUrl({ src: CLOUDINARY, width: 1200 })).toContain(
      "c_limit",
    );
  });

  it("conserva el resto de la URL", () => {
    const url = buildCloudinaryUrl({ src: CLOUDINARY, width: 320 });

    expect(url).toContain("/v1787/propiedades-claude/foto.jpg");
    expect(url.startsWith("https://res.cloudinary.com/portal/")).toBe(true);
  });

  it("respeta una calidad explícita", () => {
    const url = buildCloudinaryUrl({
      src: CLOUDINARY,
      width: 640,
      quality: 60,
    });

    expect(url).toContain("q_60");
    expect(url).not.toContain("q_auto");
  });

  it("devuelve intacta una URL que no es de Cloudinary", () => {
    const otra = "https://picsum.photos/seed/x/1200/800";

    expect(buildCloudinaryUrl({ src: otra, width: 640 })).toBe(otra);
  });
});
