"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addFavorite, removeFavorite } from "@/lib/api-client";
import { cn } from "@/lib/utils";

/**
 * Botón para guardar o quitar una propiedad (spec.md, sección 16).
 *
 * Alterna en el acto y corrige si el servidor no acompaña: esperar la
 * respuesta para pintar dejaría el botón inerte medio segundo en cada clic.
 *
 * Quien no ha iniciado sesión no ve el botón. Se decide en el servidor, en
 * quien lo coloca: aquí no se puede saber sin preguntar, y preguntar desde el
 * navegador provocaría un parpadeo en cada tarjeta.
 */
export function FavoriteButton({
  propertyId,
  propertyTitle,
  isFavorite,
  className,
}: {
  readonly propertyId: string;
  readonly propertyTitle: string;
  readonly isFavorite: boolean;
  readonly className?: string;
}) {
  const router = useRouter();
  const [isSaved, setIsSaved] = useState(isFavorite);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const wasSaved = isSaved;

    setIsSaved(!wasSaved);

    startTransition(async () => {
      try {
        await (wasSaved ? removeFavorite : addFavorite)(propertyId);
        // La lista de la cuenta se pinta en el servidor.
        router.refresh();
      } catch {
        // El servidor no lo aceptó: se deshace el cambio optimista para no
        // dejar marcado algo que no está guardado.
        setIsSaved(wasSaved);
      }
    });
  }

  const label = isSaved
    ? `Quitar ${propertyTitle} de tus guardadas`
    : `Guardar ${propertyTitle} en tus propiedades`;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isSaved}
      title={isSaved ? "Quitar de guardadas" : "Guardar"}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-full border transition-colors disabled:cursor-progress",
        isSaved
          ? "border-accent bg-accent text-white hover:bg-accent-strong"
          : "border-line bg-card/90 text-ink-muted hover:border-accent hover:text-accent",
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <HeartIcon isFilled={isSaved} />
    </button>
  );
}

function HeartIcon({ isFilled }: { readonly isFilled: boolean }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M12 20.5 4.8 13.6a4.6 4.6 0 0 1 0-6.6 4.8 4.8 0 0 1 6.7 0l.5.5.5-.5a4.8 4.8 0 0 1 6.7 0 4.6 4.6 0 0 1 0 6.6Z" />
    </svg>
  );
}
