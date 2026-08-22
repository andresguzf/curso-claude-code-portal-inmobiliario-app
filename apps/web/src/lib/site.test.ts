import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveSiteUrl } from "./site";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("resolveSiteUrl", () => {
  it("usa la URL declarada", () => {
    expect(resolveSiteUrl("https://portal.cl").href).toBe("https://portal.cl/");
  });

  it("cae en localhost cuando no hay ninguna", () => {
    // En desarrollo es donde está el portal.
    expect(resolveSiteUrl(undefined).href).toBe("http://localhost:3000/");
    expect(resolveSiteUrl("   ").href).toBe("http://localhost:3000/");
  });

  it("no tumba el renderizado con una URL mal escrita", () => {
    // Todas las páginas dependen de esto: un valor inválido no puede dejar
    // el portal sin pintar.
    const error = vi.spyOn(console, "error").mockImplementation(() => {});

    expect(resolveSiteUrl("no-es-una-url").href).toBe("http://localhost:3000/");
    expect(error).toHaveBeenCalled();
  });
});
