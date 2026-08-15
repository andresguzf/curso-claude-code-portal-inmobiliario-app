import type { NextConfig } from "next";

/**
 * URL interna del backend. El navegador nunca la ve: las peticiones salen
 * como `/api/*` hacia este mismo origen y se reescriben aquí.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // El paquete de contratos se distribuye como TypeScript sin compilar.
  transpilePackages: ["@portal/contracts"],

  images: {
    remotePatterns: [
      // Imágenes de marcador de posición del seed de desarrollo.
      // Cloudinary se incorpora en el Paso 26.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },

  /**
   * El frontend actúa de proxy hacia el backend.
   *
   * Así el navegador solo conoce un origen: no hace falta CORS y las cookies
   * de sesión del Paso 17 funcionan como same-origin, sin `SameSite=None`.
   */
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiInternalUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
