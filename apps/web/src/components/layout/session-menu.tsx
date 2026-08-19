"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import type { AuthenticatedUserDto } from "@portal/contracts";

import { logOut } from "@/lib/api-client";
import { LOGIN_NAVIGATION_ITEM } from "@/lib/navigation";
import { cn } from "@/lib/utils";

/**
 * Sesión en la barra de navegación.
 *
 * Sin sesión ofrece entrar, recordando desde dónde se pulsó para volver ahí
 * después. Con sesión muestra el nombre y permite salir.
 *
 * Quién está autenticado lo resuelve el servidor antes de pintar, así que
 * nadie ve un instante de «Ingresar» estando dentro.
 */
export function SessionMenu({
  currentUser,
  favoriteCount,
  isMobile,
  onNavigate,
}: {
  readonly currentUser: AuthenticatedUserDto | null;
  readonly favoriteCount: number;
  readonly isMobile: boolean;
  readonly onNavigate?: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLeaving, setIsLeaving] = useState(false);

  const buttonClasses =
    "rounded-md px-3 py-2 text-sm font-medium transition-colors";

  if (currentUser === null) {
    // Se conserva la ruta actual para volver a ella tras entrar.
    const href =
      pathname === LOGIN_NAVIGATION_ITEM.href
        ? LOGIN_NAVIGATION_ITEM.href
        : `${LOGIN_NAVIGATION_ITEM.href}?next=${encodeURIComponent(pathname)}`;

    return (
      <Link
        href={href}
        onClick={onNavigate}
        className={cn(
          buttonClasses,
          "block bg-accent text-center text-white hover:bg-accent-strong",
        )}
      >
        {LOGIN_NAVIGATION_ITEM.label}
      </Link>
    );
  }

  async function handleLogOut() {
    setIsLeaving(true);

    try {
      await logOut();
      onNavigate?.();
      // La sesión la pinta el servidor: hay que pedirle la página de nuevo.
      router.refresh();
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2",
        isMobile && "flex-col items-stretch",
      )}
    >
      <FavoriteCount count={favoriteCount} onNavigate={onNavigate} />

      {/* El nombre es la puerta a la cuenta: es donde se busca. */}
      <Link
        href="/account"
        onClick={onNavigate}
        className={cn(
          buttonClasses,
          "text-on-dark-muted hover:bg-header-hover hover:text-on-dark",
        )}
      >
        Hola,{" "}
        <span className="font-medium text-on-dark">{currentUser.name}</span>
      </Link>

      <button
        type="button"
        onClick={handleLogOut}
        disabled={isLeaving}
        className={cn(
          buttonClasses,
          "border border-line-on-dark text-on-dark-muted hover:bg-header-hover hover:text-on-dark disabled:cursor-progress disabled:opacity-70",
        )}
      >
        {isLeaving ? "Saliendo…" : "Salir"}
      </button>
    </div>
  );
}

/**
 * Cuántas propiedades hay guardadas, y el camino para verlas.
 *
 * Se muestra también en cero: es un elemento fijo de la barra, y ocultarlo
 * haría saltar la navegación al guardar la primera. El cero además cuenta
 * dónde vivirán las que se guarden.
 *
 * El número por sí solo no dice nada a quien no ve la pantalla, así que el
 * nombre accesible lo explica entero.
 */
function FavoriteCount({
  count,
  onNavigate,
}: {
  readonly count: number;
  readonly onNavigate?: () => void;
}) {
  const label =
    count === 1 ? "1 propiedad guardada" : `${count} propiedades guardadas`;

  return (
    <Link
      href="/account#propiedades-interesadas"
      onClick={onNavigate}
      aria-label={label}
      title={label}
      className="inline-flex min-h-11 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-on-dark-muted transition-colors hover:bg-header-hover hover:text-on-dark"
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
        className="size-5"
      >
        <path d="M12 20.5 4.8 13.6a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.5.5.5-.5a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6Z" />
      </svg>

      <span
        aria-hidden="true"
        className={cn(
          "min-w-6 rounded-full px-1.5 py-0.5 text-center text-xs font-semibold",
          count > 0
            ? "bg-accent text-white"
            : "bg-header-hover text-on-dark-muted",
        )}
      >
        {count}
      </span>
    </Link>
  );
}
