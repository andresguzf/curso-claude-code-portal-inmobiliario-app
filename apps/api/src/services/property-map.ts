import { buildMapAddress, type PropertyLocation } from "@portal/contracts";

/**
 * Integración con Google Maps (spec.md, sección 13).
 *
 * El mapa se pide a la Maps Static API desde el servidor y se reenvía al
 * navegador como una imagen de este mismo origen. Así la clave nunca sale del
 * backend, que es la condición que impone `plan.md`, sección 15: ninguna
 * variable de `apps/api/.env` puede llegar al navegador.
 *
 * La ubicación se resuelve a partir de la dirección textual. El formulario
 * administrativo no pide latitud ni longitud (spec.md, sección 6): de la
 * geocodificación se encarga Google.
 */

const STATIC_MAP_ENDPOINT = "https://maps.googleapis.com/maps/api/staticmap";

/**
 * Encuadre del mapa.
 *
 * La Static API admite hasta 640×640 por petición; `scale=2` duplica la
 * resolución para pantallas densas sin alterar el encuadre. El zoom 15
 * muestra el barrio: sitúa la propiedad sin aparentar más precisión de la
 * que tiene una dirección geocodificada (spec.md, sección 6).
 */
const MAP_SIZE = "640x360";
const MAP_SCALE = "2";
const MAP_ZOOM = "15";

/** Terracota del sistema de diseño (`--accent` en `globals.css`). */
const MARKER_COLOR = "0x9c5b34";

/**
 * Clave de la Maps Static API, o `null` si no está configurada.
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

/** Ruta pública de la imagen del mapa, relativa al origen del navegador. */
export function buildPropertyMapPath(propertyId: string): string {
  return `/api/properties/${encodeURIComponent(propertyId)}/map`;
}

/**
 * Ruta del mapa que viaja en el detalle, o `null` si falta la clave.
 *
 * El frontend no puede averiguar por sí mismo si la integración está
 * configurada —la clave es del servidor—, así que se lo dice el DTO y no un
 * intento fallido de cargar la imagen.
 */
export function buildPropertyMapImageUrl(propertyId: string): string | null {
  return readGoogleMapsApiKey() === null
    ? null
    : buildPropertyMapPath(propertyId);
}

/** URL de la Maps Static API para una ubicación. Incluye la clave. */
export function buildStaticMapUrl(
  location: PropertyLocation,
  apiKey: string,
): string {
  const mapAddress = buildMapAddress(location);

  const parameters = new URLSearchParams({
    center: mapAddress,
    zoom: MAP_ZOOM,
    size: MAP_SIZE,
    scale: MAP_SCALE,
    maptype: "roadmap",
    language: "es",
    region: "CL",
    markers: `color:${MARKER_COLOR}|${mapAddress}`,
    key: apiKey,
  });

  return `${STATIC_MAP_ENDPOINT}?${parameters.toString()}`;
}
