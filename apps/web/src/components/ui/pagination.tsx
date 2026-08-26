import Link from "next/link";
import type { ReactNode } from "react";

import { buildPageRange, PAGE_GAP } from "@/components/ui/page-range";

/**
 * Recorrido de un listado paginado (spec.md, sección 8).
 *
 * La página vive en la URL, no en el estado del componente: así se puede
 * compartir y el botón de atrás del navegador hace lo que se espera.
 *
 * Con una sola página no se pinta nada: unos controles inertes solo ocupan
 * sitio y hacen dudar de si algo falló.
 */
export function Pagination({
  basePath,
  hash = "",
  currentPage,
  lastPage,
  preserved,
  label,
}: {
  readonly basePath: string;
  readonly hash?: string;
  readonly currentPage: number;
  readonly lastPage: number;
  /**
   * Parámetros que sobreviven al cambio de página.
   *
   * Filtrar y paginar son compatibles: si al pasar de página se perdieran
   * los filtros, la segunda página mostraría otro listado que la primera.
   * `page` se ignora, porque es justo lo que este control decide.
   */
  readonly preserved: URLSearchParams;
  /** Nombre del recorrido para quien navega con lector de pantalla. */
  readonly label: string;
}) {
  if (lastPage <= 1) {
    return null;
  }

  const destino = { basePath, hash, preserved };

  return (
    <nav aria-label={label} className="mt-8 flex flex-col items-center gap-3">
      <ol className="flex flex-wrap items-center justify-center gap-1.5">
        <li>
          <PageLink
            {...destino}
            page={1}
            isDisabled={currentPage <= 1}
            title="Primera página"
          >
            <span aria-hidden="true">«</span>
          </PageLink>
        </li>
        <li>
          <PageLink
            {...destino}
            page={currentPage - 1}
            isDisabled={currentPage <= 1}
            title="Página anterior"
          >
            <span aria-hidden="true">‹</span>
          </PageLink>
        </li>

        {buildPageRange(currentPage, lastPage).map((item, indice) =>
          item === PAGE_GAP ? (
            // Sin `aria-hidden`: el hueco es información —hay páginas que no
            // se enumeran—, no decoración.
            <li
              key={`hueco-${indice}`}
              className="px-1.5 text-sm text-ink-muted select-none"
            >
              …
            </li>
          ) : (
            <li key={item}>
              <PageLink
                {...destino}
                page={item}
                isDisabled={false}
                isCurrent={item === currentPage}
                title={`Página ${item}`}
              >
                {item}
              </PageLink>
            </li>
          ),
        )}

        <li>
          <PageLink
            {...destino}
            page={currentPage + 1}
            isDisabled={currentPage >= lastPage}
            title="Página siguiente"
          >
            <span aria-hidden="true">›</span>
          </PageLink>
        </li>
        <li>
          <PageLink
            {...destino}
            page={lastPage}
            isDisabled={currentPage >= lastPage}
            title="Última página"
          >
            <span aria-hidden="true">»</span>
          </PageLink>
        </li>
      </ol>

      <p className="text-sm text-ink-muted">
        Página {currentPage} de {lastPage}
      </p>
    </nav>
  );
}

/**
 * Un destino del recorrido.
 *
 * En el límite se pinta como texto y no como enlace inerte: un enlace que no
 * lleva a ninguna parte confunde a quien navega con teclado.
 *
 * La página actual también deja de ser enlace, por lo mismo: llevaría a donde
 * ya se está. Se marca con `aria-current` para que un lector de pantalla lo
 * anuncie, porque el color por sí solo no lo dice.
 */
function PageLink({
  basePath,
  hash,
  page,
  preserved,
  isDisabled,
  isCurrent = false,
  title,
  children,
}: {
  readonly basePath: string;
  readonly hash: string;
  readonly page: number;
  readonly preserved: URLSearchParams;
  readonly isDisabled: boolean;
  readonly isCurrent?: boolean;
  readonly title: string;
  readonly children: ReactNode;
}) {
  const base =
    "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border px-3 text-sm font-medium tabular-nums";

  if (isCurrent) {
    return (
      <span
        aria-current="page"
        className={`${base} border-accent bg-accent text-on-dark`}
      >
        {children}
        <span className="sr-only"> (página actual)</span>
      </span>
    );
  }

  if (isDisabled) {
    return (
      <span className={`${base} border-line text-ink-muted opacity-40`}>
        {children}
        <span className="sr-only">{title}</span>
      </span>
    );
  }

  const parameters = new URLSearchParams(preserved);

  // La primera página no lleva parámetro: `?page=1` es la misma URL que sin
  // él, y ensucia lo que se comparte.
  if (page > 1) {
    parameters.set("page", String(page));
  } else {
    parameters.delete("page");
  }

  const query = parameters.toString();

  return (
    <Link
      href={`${basePath}${query ? `?${query}` : ""}${hash}`}
      className={`${base} border-line text-ink transition-colors hover:bg-muted`}
    >
      {children}
      <span className="sr-only">{title}</span>
    </Link>
  );
}
