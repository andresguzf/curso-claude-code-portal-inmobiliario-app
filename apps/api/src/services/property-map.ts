import { buildMapAddress, type PropertyLocation } from "@portal/contracts";

import { geocodeLocation, type GeoCoordinates } from "@/services/geocoding";

/**
 * Ubicación de una propiedad en el mapa (spec.md, sección 13).
 *
 * El backend resuelve las coordenadas; el navegador dibuja el mapa con ellas
 * (plan.md, sección 12). Esta clave es la de geocodificación y no sale de
 * aquí: la que usa el mapa en el navegador es otra, declarada en
 * `apps/web/.env`.
 */

/**
 * Clave de geocodificación, o `null` si no está configurada.
 *
 * Una clave en blanco equivale a ausente: `GOOGLE_MAPS_API_KEY=""` en el
 * `.env` de ejemplo no debe interpretarse como una configuración válida.
 */
export function readGoogleMapsApiKey(
  environmentValue: string | undefined = process.env.GOOGLE_MAPS_API_KEY,
): string | null {
  const apiKey = environmentValue?.trim() ?? "";

  return apiKey === "" ? null : apiKey;
}

/**
 * Coordenadas ya resueltas, indexadas por dirección completa.
 *
 * Una dirección no cambia de sitio, así que basta con geocodificarla una vez
 * por proceso. Sin esta caché cada visita a una ficha gastaría una consulta
 * de la cuota diaria.
 *
 * Solo se guardan los aciertos: cachear un fallo convertiría una caída
 * momentánea de Google en una ficha sin mapa hasta el siguiente despliegue.
 */
const coordinatesByAddress = new Map<string, GeoCoordinates>();

/** Cota de memoria: al llenarse se descarta la entrada más antigua. */
const MAX_CACHED_ADDRESSES = 500;

export async function resolvePropertyCoordinates(
  location: PropertyLocation,
): Promise<GeoCoordinates | null> {
  const apiKey = readGoogleMapsApiKey();

  if (apiKey === null) {
    return null;
  }

  const address = buildMapAddress(location);
  const cachedCoordinates = coordinatesByAddress.get(address);

  if (cachedCoordinates) {
    return cachedCoordinates;
  }

  const coordinates = await geocodeLocation(location, apiKey);

  if (coordinates !== null) {
    rememberCoordinates(address, coordinates);
  }

  return coordinates;
}

function rememberCoordinates(
  address: string,
  coordinates: GeoCoordinates,
): void {
  if (coordinatesByAddress.size >= MAX_CACHED_ADDRESSES) {
    const oldestAddress = coordinatesByAddress.keys().next().value;

    if (oldestAddress !== undefined) {
      coordinatesByAddress.delete(oldestAddress);
    }
  }

  coordinatesByAddress.set(address, coordinates);
}

/** Solo para pruebas: la caché vive mientras viva el proceso. */
export function clearCoordinatesCache(): void {
  coordinatesByAddress.clear();
}
