import { HTTP_STATUS, jsonError, jsonInternalError } from "@/lib/api-response";
import {
  buildStaticMapUrl,
  readGoogleMapsApiKey,
} from "@/services/property-map";
import { getPublicPropertyById } from "@/services/property-service";

/** El mapa depende del estado de publicación vigente. */
export const dynamic = "force-dynamic";

/**
 * Un mapa cambia mucho menos que la ficha que lo contiene, y cada petición a
 * Google se cobra. Un día de caché en el navegador evita repetir la llamada
 * en cada visita al detalle.
 */
const MAP_CACHE_CONTROL = "public, max-age=86400";

/** Google no debe dejar colgada la carga del detalle si tarda en responder. */
const GOOGLE_TIMEOUT_MS = 8_000;

/**
 * GET /api/properties/{id}/map
 *
 * Devuelve la imagen del mapa de una propiedad publicada.
 *
 * El backend hace de intermediario a propósito: pide el mapa a Google con su
 * clave y reenvía los bytes. Si el navegador construyera la URL de Google, la
 * clave viajaría en el HTML de cada ficha (plan.md, sección 15).
 *
 * Una propiedad inexistente y una despublicada responden ambas 404, igual que
 * en `GET /api/properties/{id}`: el mapa no puede convertirse en la vía para
 * averiguar si existe un borrador.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/properties/[id]/map">,
) {
  try {
    const { id } = await context.params;

    if (!id.trim()) {
      return jsonError(
        "El identificador de la propiedad es obligatorio.",
        HTTP_STATUS.BAD_REQUEST,
      );
    }

    const property = await getPublicPropertyById(id);

    if (!property) {
      return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    const apiKey = readGoogleMapsApiKey();

    if (apiKey === null) {
      return jsonError(
        "El mapa no está disponible en este momento.",
        HTTP_STATUS.SERVICE_UNAVAILABLE,
      );
    }

    const googleResponse = await fetch(buildStaticMapUrl(property, apiKey), {
      signal: AbortSignal.timeout(GOOGLE_TIMEOUT_MS),
    });

    if (!googleResponse.ok || googleResponse.body === null) {
      // El cuerpo del error puede contener la clave: no se propaga al cliente.
      console.error(
        `[api] GET /api/properties/${id}/map — Google Maps respondió ${googleResponse.status}`,
      );

      return jsonError(
        "No fue posible obtener el mapa de la propiedad.",
        HTTP_STATUS.BAD_GATEWAY,
      );
    }

    return new Response(googleResponse.body, {
      headers: {
        "Content-Type":
          googleResponse.headers.get("content-type") ?? "image/png",
        "Cache-Control": MAP_CACHE_CONTROL,
      },
    });
  } catch (error) {
    return jsonInternalError("GET /api/properties/[id]/map", error);
  }
}
