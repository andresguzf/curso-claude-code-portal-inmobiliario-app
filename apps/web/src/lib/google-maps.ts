import { buildMapAddress, type PropertyLocation } from "@portal/contracts";

/**
 * Enlace a Google Maps para abrir la ubicación completa.
 *
 * Complementa al mapa incrustado, que es una imagen y no permite desplazarse
 * ni ampliar. Esta URL no requiere clave: es la búsqueda pública de Google, y
 * por eso funciona incluso cuando la integración del servidor no está
 * configurada.
 */
const GOOGLE_MAPS_SEARCH_URL = "https://www.google.com/maps/search/";

export function buildGoogleMapsSearchUrl(location: PropertyLocation): string {
  const parameters = new URLSearchParams({
    api: "1",
    query: buildMapAddress(location),
  });

  return `${GOOGLE_MAPS_SEARCH_URL}?${parameters.toString()}`;
}
