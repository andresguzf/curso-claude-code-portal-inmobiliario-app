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
  isMobile,
  onNavigate,
}: {
  readonly currentUser: AuthenticatedUserDto | null;
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
      <span className={cn("px-3 py-2 text-sm text-on-dark-muted")}>
        Hola,{" "}
        <span className="font-medium text-on-dark">{currentUser.name}</span>
      </span>

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
