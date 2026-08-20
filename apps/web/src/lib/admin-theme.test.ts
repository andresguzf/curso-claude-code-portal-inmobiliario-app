import { describe, expect, it } from "vitest";

import { isAdminTheme, readAdminTheme } from "./admin-theme";

describe("readAdminTheme", () => {
  it("acepta los dos temas", () => {
    expect(readAdminTheme("dark")).toBe("dark");
    expect(readAdminTheme("light")).toBe("light");
  });

  it("cae en claro ante una cookie ausente o manipulada", () => {
    // La cookie la escribe el navegador: no se puede confiar en su valor.
    for (const value of [undefined, "", "azul", "DARK", "<script>"]) {
      expect(readAdminTheme(value)).toBe("light");
    }
  });
});

describe("isAdminTheme", () => {
  it("distingue los valores admitidos", () => {
    expect(isAdminTheme("dark")).toBe(true);
    expect(isAdminTheme("sepia")).toBe(false);
    expect(isAdminTheme(null)).toBe(false);
  });
});
