import Link from "next/link";

/**
 * Estados sin resultados del catálogo (spec.md, sección 8).
 *
 * Se distinguen tres situaciones porque conducen a acciones distintas: si la
 * API falla no hay nada que la persona pueda corregir en sus filtros; si los
 * filtros no coinciden, sí. Confundirlas llevaría a buscar el problema en el
 * lugar equivocado.
 */

type CatalogStatusProps = {
  readonly title: string;
  readonly description: string;
  /** Enlace de salida, cuando hay una acción que ofrecer. */
  readonly action?: {
    readonly href: string;
    readonly label: string;
  };
  /** Los errores se anuncian de inmediato a los lectores de pantalla. */
  readonly isError?: boolean;
};

export function CatalogStatus({
  title,
  description,
  action,
  isError = false,
}: CatalogStatusProps) {
  return (
    <div
      role={isError ? "alert" : "status"}
      className="rounded-xl border border-line bg-card px-6 py-12 text-center shadow-sm"
    >
      <p className="text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
        {description}
      </p>

      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-block rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
