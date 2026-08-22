import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";

import { AdminShell } from "@/components/admin/admin-shell";
import { FlashRegion } from "@/components/flash/flash-region";
import { ADMIN_THEME_COOKIE, readAdminTheme } from "@/lib/admin-theme";
import { requireAdminUser } from "@/lib/require-user";

import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Administración",
    template: "%s | Administración",
  },
  /** El panel no debe aparecer en buscadores. */
  robots: { index: false, follow: false },
};

/**
 * Tiñe la interfaz del navegador con el fondo real de la página.
 *
 * Se calcula por petición y no como constante porque el tema lo decide una
 * cookie: fijarlo dejaría la barra del móvil clara con el panel en oscuro.
 */
export async function generateViewport(): Promise<Viewport> {
  const theme = readAdminTheme(
    (await cookies()).get(ADMIN_THEME_COOKIE)?.value,
  );

  return { themeColor: theme === "dark" ? "#1a1d21" : "#f5f2ed" };
}

const ADMIN_PATH = "/admin";

/**
 * Disposición del área de administración (spec.md, sección 18).
 *
 * Es una raíz aparte de la del portal, no una capa encima: el panel no lleva
 * la navegación pública, ni el pie, ni nada personal. Quien administra no
 * tiene favoritos ni consultas.
 *
 * La guarda se repite en cada página. Next no vuelve a ejecutar el layout en
 * las navegaciones dentro del mismo segmento, así que confiar solo en esta
 * comprobación dejaría un hueco.
 */
export default async function AdminLayout({ children }: LayoutProps<"/">) {
  const [admin, cookieStore] = await Promise.all([
    requireAdminUser(ADMIN_PATH),
    cookies(),
  ]);

  // El tema se resuelve en el servidor: así la página llega ya pintada y no
  // hay un parpadeo de claro antes de oscuro.
  const theme = readAdminTheme(cookieStore.get(ADMIN_THEME_COOKIE)?.value);

  return (
    <html
      lang="es"
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-page">
        <FlashRegion />

        <AdminShell adminName={admin.name} theme={theme}>
          {children}
        </AdminShell>
      </body>
    </html>
  );
}
