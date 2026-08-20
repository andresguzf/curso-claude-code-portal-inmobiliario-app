import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Recorrido de un listado paginado.
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

  return (
    <nav
      aria-label={label}
      className="mt-6 flex items-center justify-between gap-4"
    >
      <PageLink
        basePath={basePath}
        hash={hash}
        page={currentPage - 1}
        preserved={preserved}
        isDisabled={currentPage <= 1}
      >
        ← Anteriores
      </PageLink>

      <p className="text-sm text-ink-muted">
        Página {currentPage} de {lastPage}
      </p>

      <PageLink
        basePath={basePath}
        hash={hash}
        page={currentPage + 1}
        preserved={preserved}
        isDisabled={currentPage >= lastPage}
      >
        Siguientes →
      </PageLink>
    </nav>
  );
}

/**
 * Un extremo del recorrido.
 *
 * En el límite se pinta como texto y no como enlace inerte: un enlace que no
 * lleva a ninguna parte confunde a quien navega con teclado.
 */
function PageLink({
  basePath,
  hash,
  page,
  preserved,
  isDisabled,
  children,
}: {
  readonly basePath: string;
  readonly hash: string;
  readonly page: number;
  readonly preserved: URLSearchParams;
  readonly isDisabled: boolean;
  readonly children: ReactNode;
}) {
  const className =
    "inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-sm font-medium";

  if (isDisabled) {
    return (
      <span className={`${className} text-ink-muted opacity-50`}>
        {children}
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
      className={`${className} text-ink transition-colors hover:bg-muted`}
    >
      {children}
    </Link>
  );
}
