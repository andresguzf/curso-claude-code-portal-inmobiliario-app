/**
 * Búsqueda textual de propiedades (spec.md, sección 9).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar las
 * reglas de búsqueda sin base de datos.
 */

/** Campos sobre los que busca la especificación. */
export const SEARCHABLE_FIELDS = [
  "title",
  "commune",
  "city",
  "region",
  "description",
] as const;

/** Evita que una consulta absurdamente larga genere un `ILIKE` costoso. */
const MAX_TERMS = 8;

/**
 * Separa la consulta en términos.
 *
 * Se dividen por espacios porque quien busca «casa las condes» espera
 * resultados: con la cadena completa ningún campo coincidiría, ya que el
 * título y la comuna son columnas distintas.
 */
export function parseSearchTerms(
  rawSearch: string | null | undefined,
): readonly string[] {
  if (!rawSearch) {
    return [];
  }

  return rawSearch.trim().split(/\s+/).filter(Boolean).slice(0, MAX_TERMS);
}

type TextMatch = {
  readonly contains: string;
  readonly mode: "insensitive";
};

export type SearchCondition = {
  OR: Record<string, TextMatch>[];
};

/**
 * Construye una condición por término de búsqueda.
 *
 * Cada término debe aparecer en algún campo, y las condiciones se combinan
 * con AND, de modo que agregar palabras acote los resultados en lugar de
 * ampliarlos. El filtrado ocurre en PostgreSQL (plan.md, sección 9).
 */
export function buildSearchConditions(
  terms: readonly string[],
): SearchCondition[] {
  return terms.map((term) => ({
    OR: SEARCHABLE_FIELDS.map((field) => ({
      [field]: { contains: term, mode: "insensitive" as const },
    })),
  }));
}
