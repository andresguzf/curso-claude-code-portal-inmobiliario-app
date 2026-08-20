"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";

import { fieldInputClassName } from "@/components/form/form-field";
import { cn } from "@/lib/utils";

/**
 * Búsqueda sobre un listado paginado.
 *
 * La usan el historial de consultas y el listado de propiedades del panel:
 * ambos buscan en el servidor y guardan el término en la URL, como el
 * catálogo, para que el resultado sea compartible y el botón de atrás haga
 * lo que se espera.
 *
 * Es un formulario de verdad, con `method="get"`: sin JavaScript sigue
 * funcionando. Al enviarlo se intercepta para navegar sin recargar y para
 * quitar de la URL los parámetros vacíos.
 */
export function SearchForm({
  basePath,
  hash = "",
  search,
  label,
  placeholder,
  className,
}: {
  readonly basePath: string;
  /** Ancla a la que saltar tras buscar, si el listado no encabeza la página. */
  readonly hash?: string;
  readonly search: string;
  readonly label: string;
  readonly placeholder: string;
  readonly className?: string;
}) {
  const fieldId = useId();
  const router = useRouter();
  const searchParams = useSearchParams();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = new FormData(event.currentTarget).get("search");
    const parameters = new URLSearchParams(searchParams.toString());

    if (typeof value === "string" && value.trim()) {
      parameters.set("search", value.trim());
    } else {
      parameters.delete("search");
    }

    // Una búsqueda nueva empieza por la primera página: la que se estaba
    // viendo no tiene por qué existir en el resultado filtrado.
    parameters.delete("page");

    const query = parameters.toString();

    router.replace(`${basePath}${query ? `?${query}` : ""}${hash}`);
  }

  return (
    <form
      method="get"
      action={basePath}
      onSubmit={submit}
      className={cn("flex flex-wrap items-end gap-3", className)}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          {label}
        </label>
        <input
          id={fieldId}
          type="search"
          name="search"
          defaultValue={search}
          placeholder={placeholder}
          className={fieldInputClassName(false)}
        />
      </div>

      <button
        type="submit"
        className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong"
      >
        Buscar
      </button>

      {search ? (
        <a
          href={`${basePath}${hash}`}
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-accent"
        >
          Limpiar
        </a>
      ) : null}
    </form>
  );
}
