"use client";

import { useState } from "react";

import { ADMIN_THEME_COOKIE, type AdminTheme } from "@/lib/admin-theme";

/** Un año: la preferencia dura hasta que se cambie. */
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Alterna entre tema claro y oscuro dentro del panel.
 *
 * Hace dos cosas a la vez, y las dos hacen falta. Cambia el atributo en el
 * acto, para que el tema responda sin esperar al servidor. Y guarda la
 * preferencia en una cookie, para que la próxima carga ya llegue pintada y
 * no haya un parpadeo de claro antes de oscuro.
 *
 * No se llama a `router.refresh()`: el atributo ya está puesto y pedir la
 * página de nuevo solo añadiría un viaje para llegar al mismo sitio.
 */
export function ThemeToggle({
  initialTheme,
}: {
  readonly initialTheme: AdminTheme;
}) {
  const [theme, setTheme] = useState<AdminTheme>(initialTheme);
  const nextTheme: AdminTheme = theme === "dark" ? "light" : "dark";

  function toggle() {
    document.documentElement.dataset.theme = nextTheme;
    document.cookie = `${ADMIN_THEME_COOKIE}=${nextTheme}; path=/; max-age=${COOKIE_MAX_AGE_SECONDS}; samesite=lax`;
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex size-11 items-center justify-center rounded-md text-ink-muted transition-colors hover:bg-muted hover:text-ink"
    >
      <span className="sr-only">
        {nextTheme === "dark"
          ? "Cambiar a tema oscuro"
          : "Cambiar a tema claro"}
      </span>
      {theme === "dark" ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function MoonIcon() {
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
      <path d="M20 13.5A8 8 0 0 1 10.5 4a8 8 0 1 0 9.5 9.5Z" />
    </svg>
  );
}

function SunIcon() {
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
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}
