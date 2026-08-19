import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Campo de formulario con etiqueta y error.
 *
 * La etiqueta se asocia por `htmlFor` y el error por `aria-describedby`, de
 * modo que quien usa un lector de pantalla oiga el motivo del rechazo al
 * llegar al campo, y no solo un «inválido» sin explicación.
 */
export function FormField({
  id,
  label,
  hint,
  error,
  children,
}: {
  readonly id: string;
  readonly label: string;
  readonly hint?: string;
  readonly error?: string | undefined;
  readonly children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
        {hint ? (
          <span className="ml-2 font-normal text-ink-muted">{hint}</span>
        ) : null}
      </label>

      {children}

      {error ? (
        <p id={`${id}-error`} className="text-sm text-accent-strong">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Clases de un control de formulario.
 *
 * El tamaño de fuente no baja de 16px a propósito: por debajo, Safari en iOS
 * amplía la página al enfocar el campo.
 */
export function fieldInputClassName(hasError: boolean): string {
  return cn(
    "w-full rounded-lg border bg-page px-3 py-2 text-base text-ink transition-colors placeholder:text-ink-muted",
    hasError ? "border-accent-strong" : "border-line hover:border-line-strong",
  );
}

/** Atributos que enlazan un control con su mensaje de error. */
export function fieldErrorAttributes(id: string, hasError: boolean) {
  return {
    "aria-invalid": hasError ? true : undefined,
    "aria-describedby": hasError ? `${id}-error` : undefined,
  } as const;
}
