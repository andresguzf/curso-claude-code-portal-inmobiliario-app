import { describe, expect, it } from "vitest";

import { IMAGE_LIMITS } from "@portal/contracts";

import { validateImageFile } from "./image-validation";

function rejectionOf(file: { type: string; size: number }) {
  const result = validateImageFile(file);

  if (result.ok) {
    throw new Error("Se esperaba un rechazo.");
  }

  return result;
}

describe("validateImageFile", () => {
  it("acepta los formatos declarados", () => {
    for (const type of IMAGE_LIMITS.allowedMimeTypes) {
      expect(validateImageFile({ type, size: 1024 }).ok).toBe(true);
    }
  });

  it("rechaza un SVG, que también es una imagen y admite scripts", () => {
    expect(rejectionOf({ type: "image/svg+xml", size: 1024 }).message).toMatch(
      /no se admite/,
    );
  });

  it("rechaza algo que no es una imagen", () => {
    expect(
      rejectionOf({ type: "application/pdf", size: 1024 }).message,
    ).toMatch(/no se admite/);
  });

  it("nombra el formato desconocido cuando el archivo no lo declara", () => {
    expect(rejectionOf({ type: "", size: 1024 }).message).toMatch(
      /desconocido/,
    );
  });

  it("rechaza un archivo vacío", () => {
    expect(rejectionOf({ type: "image/jpeg", size: 0 }).message).toBe(
      "El archivo está vacío.",
    );
  });

  it("acepta justo el tamaño máximo", () => {
    expect(
      validateImageFile({ type: "image/jpeg", size: IMAGE_LIMITS.maxBytes }).ok,
    ).toBe(true);
  });

  it("rechaza un byte por encima del máximo", () => {
    const rechazo = rejectionOf({
      type: "image/jpeg",
      size: IMAGE_LIMITS.maxBytes + 1,
    });

    expect(rechazo.message).toMatch(/5 MB/);
    // El tamaño tiene su propio código HTTP: 413, no 400.
    expect(rechazo.isTooLarge).toBe(true);
  });

  it("comprueba el formato antes que el tamaño", () => {
    // Decir «pesa demasiado» de un PDF de 20 MB haría pensar que basta con
    // encogerlo.
    const rechazo = rejectionOf({
      type: "application/pdf",
      size: IMAGE_LIMITS.maxBytes + 1,
    });

    expect(rechazo.message).toMatch(/no se admite/);
    expect(rechazo.isTooLarge).toBe(false);
  });
});
