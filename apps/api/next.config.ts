import type { NextConfig } from "next";

import { buildApiSecurityHeaders } from "./src/lib/security-headers";

const nextConfig: NextConfig = {
  // El paquete de contratos se distribuye como TypeScript sin compilar.
  transpilePackages: ["@portal/contracts"],

  // El backend tampoco tiene por qué anunciar con qué está construido.
  poweredByHeader: false,

  /** Cabeceras de seguridad de la API (spec.md, sección 24b). */
  async headers() {
    return [{ source: "/:path*", headers: buildApiSecurityHeaders() }];
  },
};

export default nextConfig;
