/**
 * Tema del panel de administración (spec.md, sección 18).
 *
 * La preferencia viaja en una cookie, no en `localStorage`, para que el
 * servidor pueda pintar el tema correcto desde el primer byte. Con
 * `localStorage` habría que leerla en el navegador y el panel aparecería un
 * instante en claro antes de saltar a oscuro.
 *
 * No es una cookie de sesión ni lleva nada sensible: es una preferencia
 * visual, así que no necesita `httpOnly`; de hecho la escribe el navegador.
 */
export const ADMIN_THEME_COOKIE = "admin_theme";

export const ADMIN_THEMES = ["light", "dark"] as const;

export type AdminTheme = (typeof ADMIN_THEMES)[number];

/** El panel arranca en claro, como el resto del portal. */
export const DEFAULT_ADMIN_THEME: AdminTheme = "light";

export function isAdminTheme(value: unknown): value is AdminTheme {
  return (
    typeof value === "string" && ADMIN_THEMES.includes(value as AdminTheme)
  );
}

export function readAdminTheme(value: string | undefined): AdminTheme {
  return isAdminTheme(value) ? value : DEFAULT_ADMIN_THEME;
}
