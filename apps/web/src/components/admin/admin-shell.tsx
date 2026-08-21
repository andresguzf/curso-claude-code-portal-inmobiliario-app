"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import {
  ADMIN_NAVIGATION_ITEMS,
  isAdminSectionActive,
} from "@/lib/admin-navigation";
import type { AdminTheme } from "@/lib/admin-theme";
import { cn } from "@/lib/utils";

import { AdminSignOut } from "./admin-sign-out";
import { ThemeToggle } from "./theme-toggle";

/**
 * Marco del panel de administración (spec.md, sección 18).
 *
 * Barra lateral a la izquierda y contenido a la derecha, sin la navegación
 * del portal: quien administra no navega el catálogo desde aquí.
 *
 * En escritorio la barra se contrae a solo iconos y conserva su sitio; en
 * móvil se abre como panel sobre el contenido, porque a esa anchura no cabe
 * ni contraída.
 */
export function AdminShell({
  adminName,
  theme,
  children,
}: {
  readonly adminName: string;
  readonly theme: AdminTheme;
  readonly children: ReactNode;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex h-full">
      <Sidebar
        isExpanded={isExpanded}
        isMobileOpen={isMobileOpen}
        onToggle={() => setIsExpanded((expanded) => !expanded)}
        onNavigate={() => setIsMobileOpen(false)}
      />

      {/* Al abrir el panel en móvil, el contenido de detrás queda tapado y
          un toque fuera lo cierra. */}
      {isMobileOpen ? (
        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
        >
          <span className="sr-only">Cerrar el menú</span>
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-card px-4 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMobileOpen(true)}
            className="rounded-md p-2 text-ink-muted transition-colors hover:bg-muted lg:hidden"
          >
            <span className="sr-only">Abrir el menú</span>
            <MenuIcon />
          </button>

          <p className="min-w-0 truncate text-sm text-ink-muted">
            <span className="font-medium text-ink">{adminName}</span>
          </p>

          <div className="flex items-center gap-2">
            <ThemeToggle initialTheme={theme} />

            <Link
              href="/"
              className="hidden rounded-md px-3 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-muted hover:text-ink sm:inline-flex"
            >
              Ver el portal
            </Link>

            <AdminSignOut />
          </div>
        </header>

        <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

function Sidebar({
  isExpanded,
  isMobileOpen,
  onToggle,
  onNavigate,
}: {
  readonly isExpanded: boolean;
  readonly isMobileOpen: boolean;
  readonly onToggle: () => void;
  readonly onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Secciones de administración"
      className={cn(
        // `min-w-0` es imprescindible: como elemento flex, su mínimo
        // automático es el ancho de su contenido, y sin esto la barra no
        // baja de los 256px por mucho que se le pida.
        // Solo se anima `transform`, que va al compositor. Animar el ancho
        // obliga a recalcular la disposición en cada fotograma, y las guías
        // de interfaz lo desaconsejan: el ancho cambia de golpe.
        "fixed inset-y-0 left-0 z-40 flex min-w-0 shrink-0 flex-col overflow-hidden border-r border-sidebar-line bg-sidebar text-sidebar-ink transition-transform duration-200",
        "lg:static lg:translate-x-0",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isExpanded ? "w-64" : "w-64 lg:w-20",
      )}
    >
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-line px-4">
        <span
          className={cn(
            "truncate text-sm font-semibold tracking-tight",
            isExpanded ? "" : "lg:hidden",
          )}
        >
          Administración
        </span>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isExpanded}
          className="ml-auto hidden rounded-md p-2 text-sidebar-ink-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-ink lg:inline-flex"
        >
          <span className="sr-only">
            {isExpanded ? "Contraer el menú" : "Expandir el menú"}
          </span>
          <ChevronIcon isPointingLeft={isExpanded} />
        </button>
      </div>

      <ul className="flex flex-1 flex-col gap-1 p-3">
        {ADMIN_NAVIGATION_ITEMS.map((item) => {
          const isActive = isAdminSectionActive(item.href, pathname);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={isActive ? "page" : undefined}
                title={isExpanded ? undefined : item.label}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-white"
                    : "text-sidebar-ink-muted hover:bg-sidebar-hover hover:text-sidebar-ink",
                  isExpanded ? "" : "lg:justify-center lg:px-0",
                )}
              >
                <svg
                  aria-hidden="true"
                  focusable="false"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-5 shrink-0"
                >
                  <path d={item.icon} />
                </svg>

                <span className={cn("truncate", isExpanded ? "" : "lg:hidden")}>
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function MenuIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      className="size-6"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function ChevronIcon({ isPointingLeft }: { readonly isPointingLeft: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d={isPointingLeft ? "M15 6l-6 6 6 6" : "M9 6l6 6-6 6"} />
    </svg>
  );
}
