/**
 * Qué páginas se enumeran en el control (spec.md, sección 8).
 *
 * Vive aparte del componente porque es aritmética, no interfaz: así se puede
 * comprobar cada caso sin montar nada.
 *
 * La regla es: la primera, la última, y una ventana alrededor de la actual.
 * Donde el salto es de más de un número aparece un separador; donde es de
 * exactamente uno se pinta ese número, porque «1 … 3» ocupa lo mismo que
 * «1 2 3» y esconde una página por nada.
 */

/** Hueco entre dos tramos. Se pinta como «…» y no es pulsable. */
export const PAGE_GAP = "gap" as const;

export type PageItem = number | typeof PAGE_GAP;

/** Cuántas páginas se muestran a cada lado de la actual. */
export const PAGE_RADIUS = 3;

export function buildPageRange(
  currentPage: number,
  lastPage: number,
  radius: number = PAGE_RADIUS,
): PageItem[] {
  if (lastPage < 1) {
    return [];
  }

  const enfocada = Math.min(Math.max(currentPage, 1), lastPage);
  const mostradas = new Set<number>([1, lastPage]);

  for (
    let pagina = enfocada - radius;
    pagina <= enfocada + radius;
    pagina += 1
  ) {
    if (pagina >= 1 && pagina <= lastPage) {
      mostradas.add(pagina);
    }
  }

  const ordenadas = [...mostradas].sort((una, otra) => una - otra);
  const items: PageItem[] = [];

  for (const [indice, pagina] of ordenadas.entries()) {
    const anterior = ordenadas[indice - 1];

    if (anterior !== undefined && pagina - anterior > 1) {
      // Un salto de exactamente uno no lleva separador: se pinta la página
      // que falta, que ocupa lo mismo y es una menos que esconder.
      items.push(pagina - anterior === 2 ? pagina - 1 : PAGE_GAP);
    }

    items.push(pagina);
  }

  return items;
}
