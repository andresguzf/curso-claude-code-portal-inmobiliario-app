import { buildMapAddress, type PropertyLocation } from "@portal/contracts";

/**
 * Geocodificación de direcciones (plan.md, sección 12).
 *
 * Traduce la dirección textual de una propiedad a coordenadas. Ocurre en el
 * servidor por dos motivos: la clave es un secreto, y así ADMIN nunca ve ni
 * escribe latitud y longitud (spec.md, sección 6).
 *
 * Se usa la versión 4 de la API. La versión clásica
 * (`maps/api/geocode/json`) exige una cuenta de facturación, mientras que la
 * v4 funciona con la clave de demostración de Google Maps Platform.
 */

const GEOCODING_ENDPOINT =
  "https://geocode.googleapis.com/v4beta/geocode/address";

/** Google no debe dejar colgada la carga de la ficha si tarda en responder. */
const GEOCODING_TIMEOUT_MS = 8_000;

export type GeoCoordinates = {
  readonly latitude: number;
  readonly longitude: number;
};

export function buildGeocodingUrl(
  location: PropertyLocation,
  apiKey: string,
): string {
  const address = encodeURIComponent(buildMapAddress(location));

  return `${GEOCODING_ENDPOINT}/${address}?key=${encodeURIComponent(apiKey)}`;
}

/**
 * Extrae las coordenadas de la respuesta de Google.
 *
 * Una dirección que Google no reconoce devuelve `200` con un cuerpo vacío,
 * no un error: sin esta comprobación, un `results[0]` inexistente reventaría
 * la ficha entera por no encontrar el mapa.
 */
export function readCoordinates(payload: unknown): GeoCoordinates | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const results = (payload as { results?: unknown }).results;

  if (!Array.isArray(results) || results.length === 0) {
    return null;
  }

  const location = (results[0] as { location?: unknown }).location;

  if (typeof location !== "object" || location === null) {
    return null;
  }

  const { latitude, longitude } = location as {
    latitude?: unknown;
    longitude?: unknown;
  };

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  return { latitude, longitude };
}

/**
 * Coordenadas de una dirección, o `null` si Google no la reconoce.
 *
 * Un fallo de geocodificación no es un fallo de la propiedad: la ficha debe
 * seguir mostrándose con su dirección y su enlace a Google Maps aunque no
 * haya mapa.
 */
export async function geocodeLocation(
  location: PropertyLocation,
  apiKey: string,
): Promise<GeoCoordinates | null> {
  try {
    const response = await fetch(buildGeocodingUrl(location, apiKey), {
      signal: AbortSignal.timeout(GEOCODING_TIMEOUT_MS),
    });

    if (!response.ok) {
      // El cuerpo del error puede contener la clave: no se propaga.
      console.error(`[api] Geocoding respondió ${response.status}`);

      return null;
    }

    return readCoordinates(await response.json());
  } catch (error) {
    console.error("[api] No fue posible geocodificar la dirección", error);

    return null;
  }
}
