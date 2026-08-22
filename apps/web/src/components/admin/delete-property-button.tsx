"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteAdminProperty } from "@/lib/api-client";
import { flashSuccess } from "@/lib/flash";

/**
 * Elimina una propiedad del portal (spec.md, sección 19).
 *
 * El borrado es lógico: la propiedad desaparece del portal y de aquí, pero
 * sus consultas y los favoritos ajenos se conservan. El texto lo dice, para
 * que quien administra no crea que está destruyendo contactos comerciales
 * ni que puede recuperarla desde la interfaz.
 *
 * Para retirarla del catálogo conservándola a la vista está despublicarla,
 * que es una acción distinta y vive en el formulario.
 */
export function DeletePropertyButton({
  propertyId,
  propertyTitle,
}: {
  readonly propertyId: string;
  readonly propertyTitle: string;
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function remove() {
    setErrorMessage(null);

    startTransition(async () => {
      try {
        await deleteAdminProperty(propertyId);
        flashSuccess(`«${propertyTitle}» ya no figura en el catálogo.`);
        setIsConfirming(false);
        router.refresh();
      } catch (error) {
        // El diálogo se cierra igualmente: el aviso vive en la fila, que es
        // lo que queda a la vista.
        setIsConfirming(false);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "No pudimos eliminar la propiedad.",
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-3 text-sm font-medium text-ink-muted transition-colors hover:border-danger hover:text-danger disabled:cursor-progress"
      >
        {/* El nombre accesible dice de qué propiedad se trata: en una tabla,
            diez botones llamados «Eliminar» no distinguen nada. */}
        <span aria-hidden="true">Eliminar</span>
        <span className="sr-only">Eliminar la propiedad {propertyTitle}</span>
      </button>

      {errorMessage ? (
        <p role="status" className="mt-1 text-xs text-danger">
          {errorMessage}
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirming}
        title="Eliminar la propiedad"
        description={`«${propertyTitle}» dejará de existir para el portal y para la administración. Sus consultas y los favoritos de otras personas se conservan. Si solo quieres retirarla del catálogo, despublícala.`}
        confirmLabel="Sí, eliminarla"
        cancelLabel="No, conservarla"
        pendingLabel="Eliminando…"
        isPending={isPending}
        onConfirm={remove}
        onCancel={() => setIsConfirming(false)}
      />
    </>
  );
}
