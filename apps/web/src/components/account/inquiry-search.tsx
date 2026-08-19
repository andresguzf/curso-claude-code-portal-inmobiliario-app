"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useId } from "react";

import { fieldInputClassName } from "@/components/form/form-field";
import { cn } from "@/lib/utils";

/**
 * Búsqueda dentro del historial propio.
 *
 * Busca en el título de la propiedad y en el texto del mensaje, que son las
 * dos formas naturales de recordar una consulta.
 *
 * Es un formulario de verdad, con `method="get"`: sin JavaScript sigue
 * funcionando. Al enviarlo se intercepta para navegar sin recargar y para
 * quitar de la URL los parámetros vacíos.
 */
export function InquirySearch({
  search,
  className,
}: {
  readonly search: string;
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

    router.replace(
      `/account${query ? `?${query}` : ""}#propiedades-consultadas`,
    );
  }

  return (
    <form
      method="get"
      action="/account"
      onSubmit={submit}
      className={cn("flex flex-wrap items-end gap-3", className)}
    >
      <div className="flex min-w-56 flex-1 flex-col gap-2">
        <label htmlFor={fieldId} className="text-sm font-medium text-ink">
          Buscar en mis consultas
        </label>
        <input
          id={fieldId}
          type="search"
          name="search"
          defaultValue={search}
          placeholder="Título de la propiedad o texto del mensaje"
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
          href="/account#propiedades-consultadas"
          className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-ink-muted underline underline-offset-4 hover:text-accent"
        >
          Limpiar
        </a>
      ) : null}
    </form>
  );
}
