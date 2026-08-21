/**
 * Normalización del texto de búsqueda (spec.md, sección 9).
 *
 * «montana» debe encontrar «montaña» y «concon» debe encontrar «Concón»:
 * quien busca escribe sin acentos, y quien no sabe cómo se escribe una
 * comuna tampoco puede acertar con la eñe.
 *
 * Vive en el contrato compartido porque la misma regla se aplica dos veces y
 * tienen que coincidir: al **guardar** la copia normalizada de cada campo y
 * al **preparar** lo que se teclea. Si divergieran, lo guardado y lo buscado
 * dejarían de encontrarse.
 *
 * `NFD` separa cada letra de su tilde y el rango que se descarta son las
 * marcas combinantes, escrito por su código porque los caracteres literales
 * serían invisibles al leer esta línea. La eñe entra por el mismo camino: es
 * una `n` con tilde superpuesta.
 */
export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Une varios campos en el texto por el que se busca una fila. */
export function buildSearchText(
  ...values: readonly (string | null | undefined)[]
): string {
  return normalizeSearchText(values.filter(Boolean).join(" "));
}
