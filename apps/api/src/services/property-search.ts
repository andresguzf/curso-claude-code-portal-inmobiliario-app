import { normalizeSearchText } from "@portal/contracts";

/**
 * Búsqueda textual de propiedades (spec.md, sección 9).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar las
 * reglas de búsqueda sin base de datos.
 *
 * Se busca contra `searchText`, la copia normalizada que reúne título,
 * ubicación y descripción sin acentos ni mayúsculas. Comparar campo a campo
 * con `ILIKE` distinguía acentos: «montana» no encontraba «montaña».
 */

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

  // Se normaliza cada término con la misma regla con la que se guardó el
  // texto: si divergieran, lo escrito y lo buscado no se encontrarían.
  return normalizeSearchText(rawSearch)
    .split(" ")
    .filter(Boolean)
    .slice(0, MAX_TERMS);
}

export type SearchCondition = {
  readonly searchText: { readonly contains: string };
};

/**
 * Construye una condición por término de búsqueda.
 *
 * Cada término debe aparecer en el texto normalizado, y las condiciones se
 * combinan con AND, de modo que agregar palabras acote los resultados en
 * lugar de ampliarlos. El filtrado ocurre en PostgreSQL (plan.md, sección 9).
 *
 * No hace falta `mode: "insensitive"`: lo guardado y lo buscado ya están en
 * minúsculas, así que la comparación puede ser exacta y aprovechar mejor el
 * índice si algún día se añade uno.
 */
export function buildSearchConditions(
  terms: readonly string[],
): SearchCondition[] {
  return terms.map((term) => ({ searchText: { contains: term } }));
}
