import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { FlashRegion } from "@/components/flash/flash-region";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/current-user";
import { getFavoritePropertyIds } from "@/lib/favorites";
import { resolveSiteUrl, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  /**
   * Base para las URL relativas de la metadata.
   *
   * Open Graph exige direcciones absolutas: una imagen relativa no la
   * resuelve el servidor que lee la etiqueta al compartir un enlace.
   */
  metadataBase: resolveSiteUrl(),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    locale: "es_CL",
    url: "/",
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
};

/**
 * Tiñe la interfaz del navegador con el color del header, de modo que la
 * barra de estado en móvil no corte visualmente la página.
 */
export const viewport: Viewport = {
  themeColor: "#2f3a45",
};

const MAIN_CONTENT_ID = "contenido-principal";

/**
 * Disposición del portal público.
 *
 * El área de administración tiene la suya, en `(admin)`: son dos raíces
 * distintas y no una anidada dentro de otra, porque el panel no debe
 * arrastrar la cabecera ni el pie del portal.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  // La sesión se resuelve antes de pintar, para que el header no muestre
  // «Ingresar» un instante a quien ya inició sesión.
  const [currentUser, favoritePropertyIds] = await Promise.all([
    getCurrentUser(),
    getFavoritePropertyIds(),
  ]);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar al contenido principal
        </a>

        <SiteHeader
          currentUser={currentUser}
          favoriteCount={favoritePropertyIds?.size ?? 0}
        />

        <FlashRegion />

        <main id={MAIN_CONTENT_ID} className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
