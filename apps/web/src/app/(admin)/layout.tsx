import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AdminShell } from "@/components/admin/admin-shell";
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

export const viewport: Viewport = {
  themeColor: "#2f3a45",
};

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
  const admin = await requireAdminUser(ADMIN_PATH);

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-page">
        <AdminShell adminName={admin.name}>{children}</AdminShell>
      </body>
    </html>
  );
}
