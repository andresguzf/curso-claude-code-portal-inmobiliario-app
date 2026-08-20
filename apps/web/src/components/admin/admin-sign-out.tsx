"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { logOut } from "@/lib/api-client";

/**
 * Cierra la sesión desde el panel.
 *
 * Tras salir se va a la portada y no al login: quien administra deja de
 * administrar, y el portal es el destino natural.
 */
export function AdminSignOut() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  async function signOut() {
    setIsLeaving(true);

    try {
      await logOut();
      router.replace("/");
      router.refresh();
    } finally {
      setIsLeaving(false);
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={isLeaving}
      className="inline-flex min-h-11 items-center rounded-md border border-line px-3 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:cursor-progress disabled:opacity-70"
    >
      {isLeaving ? "Saliendo…" : "Salir"}
    </button>
  );
}
