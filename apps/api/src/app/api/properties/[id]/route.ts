import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { getPublicPropertyById } from "@/services/property-service";

/** Los datos provienen de PostgreSQL en cada solicitud. */
export const dynamic = "force-dynamic";

/**
 * GET /api/properties/{id}
 *
 * Devuelve el detalle de una propiedad publicada. Una propiedad inexistente
 * y una despublicada responden ambas 404: la API pública no revela la
 * existencia de borradores.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/properties/[id]">,
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

    return jsonOk(property);
  } catch (error) {
    return jsonInternalError("GET /api/properties/[id]", error);
  }
}
