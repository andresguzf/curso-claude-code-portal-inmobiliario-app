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
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
