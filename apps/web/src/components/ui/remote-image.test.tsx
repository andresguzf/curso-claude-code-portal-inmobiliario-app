import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemoteImage } from "./remote-image";

const CLOUDINARY =
  "https://res.cloudinary.com/portal/image/upload/v1787/propiedades-claude/foto.jpg";

describe("RemoteImage", () => {
  it("pide la imagen ya redimensionada a Cloudinary", () => {
    render(
      <RemoteImage src={CLOUDINARY} alt="Casa" width={640} height={480} />,
    );

    const src = screen.getByAltText("Casa").getAttribute("src") ?? "";

    expect(src).toContain("res.cloudinary.com");
    expect(src).toContain("f_auto");
    expect(src).toContain("c_limit");
  });

  it("deja el resto al optimizador de Next", () => {
    // Con un cargador propio Next deja de optimizar, así que solo se le pone
    // a las imágenes que Cloudinary puede transformar.
    render(
      <RemoteImage
        src="https://picsum.photos/seed/x/1200/800"
        alt="Marcador"
        width={640}
        height={480}
      />,
    );

    expect(screen.getByAltText("Marcador").getAttribute("src")).toContain(
      "/_next/image",
    );
  });
});
