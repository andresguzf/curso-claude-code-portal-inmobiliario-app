"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

import {
  dismissFlash,
  getFlashServerSnapshot,
  getFlashSnapshot,
  subscribeFlash,
  type FlashMessage,
} from "@/lib/flash";

/**
 * Avisos de confirmación (spec.md, sección 23b).
 *
 * Se pinta en las dos raíces —el portal y el panel—, arriba y por encima del
 * contenido, para que el aviso aparezca donde se está mirando y no al final
 * de una página larga.
 *
 * Los mensajes se leen con `useSyncExternalStore` porque viven fuera de
 * React: la cola está en `sessionStorage` para sobrevivir al salto entre las
 * dos raíces, que son dos documentos distintos.
 */
export function FlashRegion() {
  const messages = useSyncExternalStore(
    subscribeFlash,
    getFlashSnapshot,
    getFlashServerSnapshot,
  );

  if (messages.length === 0) {
    // Sin mensajes no se reserva sitio: un contenedor vacío empujaría la
    // página hacia abajo y la movería al aparecer el primer aviso.
    return null;
  }

  return (
    <div
      // `pointer-events-none` en el contenedor y `auto` en cada aviso: así la
      // franja no intercepta los clics de lo que queda debajo.
      className="pointer-events-none fixed inset-x-0 top-2 z-50 flex flex-col items-center gap-2 px-4 pt-[env(safe-area-inset-top)]"
    >
      {messages.map((mensaje) => (
        <FlashItem key={mensaje.id} message={mensaje} />
      ))}
    </div>
  );
}

/** Lo que tarda un aviso en irse solo (spec.md, sección 23b). */
const VISIBLE_MS = 5000;

function FlashItem({ message }: { readonly message: FlashMessage }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const temporizador = window.setTimeout(
      () => dismissFlash(message.id),
      VISIBLE_MS,
    );

    return () => window.clearTimeout(temporizador);
  }, [paused, message.id]);

  const esError = message.tone === "error";

  return (
    <div
      // `status` y no `alert`: el aviso confirma algo que la persona acaba de
      // pedir, así que se anuncia sin interrumpir lo que se esté leyendo.
      role="status"
      // La cuenta atrás se detiene mientras se lee o mientras el foco está
      // dentro: un aviso que se va a media lectura no ha informado a nadie.
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={`pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-lg border bg-card px-4 py-3 shadow-lg ${
        esError ? "border-danger" : "border-success"
      }`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 text-base leading-none ${esError ? "text-danger" : "text-success"}`}
      >
        {esError ? "!" : "✓"}
      </span>

      <p className="flex-1 text-sm text-ink">{message.text}</p>

      <button
        type="button"
        onClick={() => dismissFlash(message.id)}
        className="-my-1 -mr-2 rounded-md px-2 py-1 text-lg leading-none text-ink-muted transition-colors hover:text-ink"
      >
        <span aria-hidden="true">×</span>
        <span className="sr-only">Cerrar el aviso</span>
      </button>
    </div>
  );
}
