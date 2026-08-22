"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

/**
 * Diálogo de confirmación para una acción que no se deshace.
 *
 * Usa el elemento `<dialog>` nativo, no un `div` con posición fija: el
 * navegador ya atrapa el foco dentro, cierra con `Esc`, vuelve el foco al
 * botón que lo abrió e inertiza el fondo. Replicar todo eso a mano es donde
 * suelen quedarse a medias los diálogos hechos en casa.
 */
export function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  pendingLabel = "Un momento…",
  isPending = false,
  onConfirm,
  onCancel,
}: {
  readonly isOpen: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel: string;
  readonly cancelLabel?: string;
  /** Reemplaza al de confirmar mientras la acción está en curso. */
  readonly pendingLabel?: string;
  readonly isPending?: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  /**
   * Sincroniza con el elemento `<dialog>`, que mantiene su estado de apertura
   * fuera de React. Es uno de los usos legítimos de `useEffect`.
   */
  useEffect(() => {
    const dialog = dialogRef.current;

    if (!dialog) {
      return;
    }

    if (isOpen && !dialog.open) {
      dialog.showModal();
    }

    if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="titulo-confirmacion"
      aria-describedby="descripcion-confirmacion"
      // `Esc` cierra el diálogo por su cuenta: hay que enterarse para que el
      // estado de React no quede creyendo que sigue abierto.
      onClose={onCancel}
      onCancel={onCancel}
      // Pulsar el fondo equivale a cancelar. El propio `<dialog>` es quien
      // recibe ese clic: el panel interior lo detiene.
      onClick={(event) => {
        if (event.target === dialogRef.current) {
          onCancel();
        }
      }}
      className={cn(
        "m-auto w-[min(28rem,calc(100vw-2rem))] rounded-xl border border-line bg-card p-0 text-ink shadow-2xl",
        "backdrop:bg-ink/50",
        // Sin esto, seguir desplazando al llegar al final del diálogo mueve
        // la página de detrás, que se supone inerte.
        "overscroll-contain",
      )}
    >
      <div className="flex flex-col gap-3 p-6">
        <h2
          id="titulo-confirmacion"
          className="text-lg font-semibold tracking-tight"
        >
          {title}
        </h2>

        <p id="descripcion-confirmacion" className="text-sm text-ink-muted">
          {description}
        </p>

        <div className="mt-3 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-muted disabled:opacity-70"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent-strong px-4 text-sm font-semibold text-white transition-colors hover:bg-accent disabled:cursor-progress disabled:opacity-70"
          >
            {isPending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
