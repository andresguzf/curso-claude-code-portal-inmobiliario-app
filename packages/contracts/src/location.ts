/**
 * Construcción de la dirección de una propiedad (spec.md, sección 6).
 *
 * Vive en el contrato porque backend y frontend deben nombrar el mismo lugar
 * con el mismo texto: el backend se lo entrega a Google Maps y el frontend lo
 * muestra y lo enlaza. Si cada lado armara la dirección por su cuenta, el
 * mapa y la ficha podrían acabar apuntando a sitios distintos.
 */

/** Campos de ubicación que el administrador completa a mano. */
export type PropertyLocation = {
  readonly address: string;
  readonly commune: string;
  readonly city: string;
  readonly region: string;
};

/** El portal opera sobre un único mercado (spec.md, sección 1). */
export const COUNTRY_NAME = "Chile";

/**
 * Dirección legible, sin país.
 *
 * Descarta las partes vacías y las repetidas: en regiones es habitual que la
 * comuna y la ciudad se llamen igual, y «Valparaíso, Valparaíso» no aporta
 * nada a quien lee.
 */
export function buildFullAddress(location: PropertyLocation): string {
  const parts = [
    location.address,
    location.commune,
    location.city,
    location.region,
  ]
    .map((part) => part.trim())
    .filter((part) => part !== "");

  return parts
    .filter((part, index) => parts.indexOf(part) === index)
    .join(", ");
}

/**
 * Dirección tal como se le entrega a Google Maps.
 *
 * Añade el país porque la geocodificación es ambigua sin él: «Providencia» o
 * «La Florida» existen en varios países hispanohablantes, y una consulta sin
 * país puede resolverse en el continente equivocado.
 */
export function buildMapAddress(location: PropertyLocation): string {
  const fullAddress = buildFullAddress(location);

  return fullAddress === "" ? COUNTRY_NAME : `${fullAddress}, ${COUNTRY_NAME}`;
}
