"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { hideInquiry } from "@/lib/api-client";

/**
 * Quita una solicitud del historial propio.
 *
 * La solicitud no se borra: sigue disponible para la inmobiliaria, que es
 * quien tiene que responderla (spec.md, sección 17). Por eso el texto habla
 * del historial y no promete una desaparición que no ocurre.
 *
 * Pide confirmación antes de actuar: quitar algo del historial no se deshace,
 * y el botón está a un dedo del enlace que abre la propiedad.
 *
 * Va por encima del enlace que cubre el registro, con `z-10`, o quedaría
 * debajo y no se podría pulsar.
 */
export function HideInquiryButton({
  inquiryId,
  propertyTitle,
}: {
  readonly inquiryId: string;
  readonly propertyTitle: string;
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isPending, startTransition] = useTransition();

  function remove() {
    setHasFailed(false);

    startTransition(async () => {
      try {
        await hideInquiry(inquiryId);
        setIsConfirming(false);
        router.refresh();
      } catch {
        // El diálogo se cierra igualmente: el aviso vive en el registro, que
        // es lo que queda a la vista.
        setIsConfirming(false);
        setHasFailed(true);
      }
    });
  }

  return (
    <div className="z-10 flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={() => setIsConfirming(true)}
        disabled={isPending}
        className="inline-flex size-11 items-center justify-center rounded-full border border-line text-ink-muted transition-colors hover:border-accent-strong hover:text-accent-strong disabled:cursor-progress"
      >
        <span className="sr-only">
          Quitar de mi historial la consulta sobre {propertyTitle}
        </span>
        <TrashIcon />
      </button>

      {hasFailed ? (
        <p role="status" className="text-xs text-danger">
          No se pudo
        </p>
      ) : null}

      <ConfirmDialog
        isOpen={isConfirming}
        title="Quitar de tu historial"
        description={`La consulta sobre «${propertyTitle}» dejará de aparecer aquí. La inmobiliaria la conserva para poder responderte.`}
        confirmLabel="Sí, quitarla"
        cancelLabel="No, conservarla"
        pendingLabel="Quitando…"
        isPending={isPending}
        onConfirm={remove}
        onCancel={() => setIsConfirming(false)}
      />
    </div>
  );
}

function TrashIcon() {
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
      <path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
    </svg>
  );
}
