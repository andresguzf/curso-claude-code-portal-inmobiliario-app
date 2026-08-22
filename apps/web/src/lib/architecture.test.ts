import { readdirSync, readFileSync } from "node:fs";
import { join, relative, resolve } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * Reglas de arquitectura que ningún tipo puede sostener (plan.md, sección 3).
 *
 * Las importaciones prohibidas las ataja ESLint, que avisa en el editor. Una
 * directiva no es una importación y ninguna regla la expresa, así que se
 * comprueba leyendo los archivos: es tosco, pero es lo que hay entre «no lo
 * hacemos» y «no se puede hacer».
 */

const RAIZ = resolve(__dirname, "../../../..");

function archivosFuente(directorio: string): string[] {
  const encontrados: string[] = [];

  for (const entrada of readdirSync(directorio, { withFileTypes: true })) {
    const ruta = join(directorio, entrada.name);

    if (entrada.isDirectory()) {
      // Lo generado por Prisma y lo compilado no son código que escribamos.
      if (["node_modules", ".next", "generated"].includes(entrada.name)) {
        continue;
      }

      encontrados.push(...archivosFuente(ruta));
    } else if (/\.tsx?$/.test(entrada.name)) {
      encontrados.push(ruta);
    }
  }

  return encontrados;
}

const FUENTES = [
  ...archivosFuente(join(RAIZ, "apps/web/src")),
  ...archivosFuente(join(RAIZ, "apps/api/src")),
  ...archivosFuente(join(RAIZ, "packages/contracts/src")),
];

describe("reglas de arquitectura", () => {
  it("encuentra código que revisar", () => {
    // Si el recorrido se rompiera, las comprobaciones de abajo pasarían por
    // no mirar nada, que es la peor forma de pasar.
    expect(FUENTES.length).toBeGreaterThan(100);
  });

  it("no existe ninguna Server Action", () => {
    const culpables = FUENTES.filter((ruta) =>
      /^\s*["']use server["']/m.test(readFileSync(ruta, "utf8")),
    ).map((ruta) => relative(RAIZ, ruta));

    // La comunicación es REST por Route Handlers (plan.md, sección 1). Una
    // Server Action abre un segundo camino hacia el servidor que no pasa por
    // `/api/*` y que ninguna guarda de las que hay comprueba.
    expect(culpables).toEqual([]);
  });

  it("el frontend no importa el cliente de PostgreSQL", () => {
    const delFrontend = FUENTES.filter((ruta) =>
      ruta.includes(join("apps", "web")),
    );
    const culpables = delFrontend
      .filter((ruta) =>
        /from\s+["'](@prisma\/|pg["']|.*generated\/prisma)/.test(
          readFileSync(ruta, "utf8"),
        ),
      )
      .map((ruta) => relative(RAIZ, ruta));

    expect(culpables).toEqual([]);
  });

  it("el frontend solo sale a la red por /api o por Web3Forms", () => {
    const permitidos = ["lib/api-client.ts", "lib/web3forms.ts"];
    const culpables = FUENTES.filter(
      (ruta) => ruta.includes(join("apps", "web")) && !/\.test\.tsx?$/.test(ruta),
    )
      .filter((ruta) => /\bfetch\(/.test(readFileSync(ruta, "utf8")))
      .map((ruta) => relative(RAIZ, ruta))
      .filter((ruta) => !permitidos.some((p) => ruta.endsWith(p)));

    // Una llamada suelta en un componente se salta el manejo de errores y los
    // códigos que traduce el cliente REST, y nadie se entera hasta que falla.
    expect(culpables).toEqual([]);
  });
});
