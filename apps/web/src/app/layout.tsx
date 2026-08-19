import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/current-user";
import { getFavoritePropertyIds } from "@/lib/favorites";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Portal Inmobiliario",
    template: "%s | Portal Inmobiliario",
  },
  description:
    "Encuentra propiedades en venta y arriendo: casas, departamentos, terrenos y oficinas.",
};

/**
 * Tiñe la interfaz del navegador con el color del header, de modo que la
 * barra de estado en móvil no corte visualmente la página.
 */
export const viewport: Viewport = {
  themeColor: "#2f3a45",
};

const MAIN_CONTENT_ID = "contenido-principal";

export default async function RootLayout({ children }: LayoutProps<"/">) {
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

        <main id={MAIN_CONTENT_ID} className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
