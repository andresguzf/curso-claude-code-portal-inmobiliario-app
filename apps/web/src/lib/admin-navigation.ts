/**
 * Secciones del panel de administración (spec.md, sección 18).
 *
 * Solo figuran las que existen. Un enlace que lleva a un 404 hace dudar de
 * si el panel está roto o la sección aún no está hecha, y esa duda cuesta
 * más que la ausencia del enlace.
 *
 * Las de propiedades, usuarios y consultas se añaden en los pasos 24, 29
 * y 30.
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
