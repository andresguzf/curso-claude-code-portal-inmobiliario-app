import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    /**
     * `RemoteImage` envuelve a `next/image`.
     *
     * Sin declararlo, el analizador de accesibilidad deja de comprobar el
     * texto alternativo en quien lo usa: vería un componente cualquiera, no
     * una imagen.
     */
    settings: { "jsx-a11y": { components: { RemoteImage: "img" } } },
  },
  {
    /**
     * El frontend no habla con PostgreSQL (plan.md, sección 3).
     *
     * La regla se cumplía por convención, pero nada la sostenía: npm iza las
     * dependencias del monorepo a la raíz, así que `@prisma/client` se
     * resuelve desde aquí aunque `apps/web` no lo declare, y un import
     * escrito por descuido compilaría sin protestar.
     *
     * Con esto deja de compilar, que es la diferencia entre una regla escrita
     * y una regla que se aplica sola.
     *
     * `server-only` no está en la lista, y no por descuido: el frontend lo usa
     * bien en las guardas de página, para que esos módulos no acaben en el
     * paquete del navegador. Prohibirlo sería prohibir la precaución.
     */
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "El frontend no accede a PostgreSQL: pide los datos a /api/*.",
            },
            {
              name: "@prisma/adapter-pg",
              message:
                "El frontend no accede a PostgreSQL: pide los datos a /api/*.",
            },
            {
              name: "pg",
              message:
                "El frontend no accede a PostgreSQL: pide los datos a /api/*.",
            },
          ],
          patterns: [
            {
              group: [
                "**/generated/prisma/**",
                "**/apps/api/**",
                "@portal/api*",
              ],
              message:
                "El frontend no importa nada del backend: la frontera es /api/*.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
