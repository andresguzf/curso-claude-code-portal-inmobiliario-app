import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

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

const MAIN_CONTENT_ID = "contenido-principal";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a
          href={`#${MAIN_CONTENT_ID}`}
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-100 focus:rounded-md focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-background"
        >
          Saltar al contenido principal
        </a>

        <SiteHeader />

        <main id={MAIN_CONTENT_ID} className="flex-1">
          {children}
        </main>

        <SiteFooter />
      </body>
    </html>
  );
}
