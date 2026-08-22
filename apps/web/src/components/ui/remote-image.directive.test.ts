import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * `RemoteImage` tiene que ser un componente de cliente.
 *
 * Le pasa a `next/image` un cargador, que es una función, y una función no
 * se puede enviar de un componente de servidor a uno de cliente: React lanza
 * «Functions cannot be passed directly to Client Components» y la página
 * responde 500.
 *
 * No lo detecta ninguna prueba de render: en jsdom no existe esa frontera.
 * Por eso se comprueba la directiva directamente sobre el archivo.
 */
describe("remote-image.tsx", () => {
  it("declara «use client»", () => {
    const fuente = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), "remote-image.tsx"),
      "utf8",
    );

    expect(fuente.trimStart().startsWith('"use client";')).toBe(true);
  });
});
