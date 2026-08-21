/**
 * Secciones del panel de administración (spec.md, sección 18).
 *
 * Solo figuran las que existen. Un enlace que lleva a un 404 hace dudar de
 * si el panel está roto o la sección aún no está hecha, y esa duda cuesta
 * más que la ausencia del enlace.
 *
 * La de consultas se añade en el paso 30.
 */
export type AdminNavigationItem = {
  readonly href: string;
  readonly label: string;
  /** Trazo del icono, sobre una rejilla de 24. */
  readonly icon: string;
};

export const ADMIN_NAVIGATION_ITEMS: readonly AdminNavigationItem[] = [
  {
    href: "/admin",
    label: "Resumen",
    icon: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6V11h-6v9Zm0-16v5h6V4h-6Z",
  },
  {
    href: "/admin/properties",
    label: "Propiedades",
    icon: "M3 10.5 12 4l9 6.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5Z",
  },
  {
    href: "/admin/features",
    label: "Características",
    icon: "M12 4l2.4 5 5.6.7-4 3.9 1 5.4-5-2.7-5 2.7 1-5.4-4-3.9 5.6-.7L12 4Z",
  },
  {
    href: "/admin/users",
    label: "Usuarios",
    icon: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6 9a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M17 14a6 6 0 0 1 4 6",
  },
  {
    href: "/admin/profile",
    label: "Mi perfil",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0",
  },
];

/** Una sección está activa también en sus subrutas. */
export function isAdminSectionActive(href: string, pathname: string): boolean {
  if (href === "/admin") {
    return pathname === "/admin";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
