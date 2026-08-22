import type { NextConfig } from "next";

import { buildSecurityHeaders } from "./src/lib/security-headers";

/**
 * URL interna del backend. El navegador nunca la ve: las peticiones salen
 * como `/api/*` hacia este mismo origen y se reescriben aquí.
 */
const apiInternalUrl = process.env.API_INTERNAL_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  // El paquete de contratos se distribuye como TypeScript sin compilar.
  transpilePackages: ["@portal/contracts"],

  // `X-Powered-By` anuncia el marco y su versión sin que nadie lo necesite:
  // es información gratis para quien busque una vulnerabilidad conocida.
  poweredByHeader: false,

  images: {
    remotePatterns: [
      // Imágenes de las propiedades (paso 26).
      //
      // El patrón admite el servidor entero, no solo nuestra cuenta: el
      // nombre de la cuenta vive en `apps/api`, y el frontend no lo conoce.
      // Es aceptable porque estas URL no las escribe nadie de fuera: salen
      // de PostgreSQL, y allí solo llegan las que sube esta API.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Imágenes de marcador de posición del seed de desarrollo.
      { protocol: "https", hostname: "picsum.photos" },
      // Fotografía de fondo del hero.
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },

  /**
   * El frontend actúa de proxy hacia el backend.
   *
   * Así el navegador solo conoce un origen: no hace falta CORS y las cookies
   * de sesión del Paso 17 funcionan como same-origin, sin `SameSite=None`.
   */
  /**
   * Cabeceras de seguridad (spec.md, sección 24b).
   *
   * Se aplican a todo lo que sirve la aplicación, incluidos los archivos
   * estáticos, que el middleware no llega a ver.
   */
  async headers() {
    return [{ source: "/:path*", headers: buildSecurityHeaders() }];
  },

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
