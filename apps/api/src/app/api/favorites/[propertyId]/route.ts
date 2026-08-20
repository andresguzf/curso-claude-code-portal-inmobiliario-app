import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireStandardUser } from "@/lib/auth-guard";
import { addFavorite, removeFavorite } from "@/services/favorite-service";

export const dynamic = "force-dynamic";

/**
 * POST /api/favorites/{propertyId}
 *
 * Guarda una propiedad publicada. Repetir la llamada no crea un duplicado ni
 * falla: la restricción de unicidad del esquema lo impide y la operación es
 * idempotente, que es lo que necesita un botón que alterna.
 *
 * Una propiedad inexistente y una despublicada responden ambas 404, como en
 * el resto de la API pública.
 */
export async function POST(
  _request: Request,
  context: RouteContext<"/api/favorites/[propertyId]">,
) {
  try {
    const session = await requireStandardUser();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;
    const outcome = await addFavorite(session.user.id, propertyId);

    if (outcome.status === "property-not-found") {
      return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk({ message: "Propiedad guardada." }, HTTP_STATUS.CREATED);
  } catch (error) {
    return jsonInternalError("POST /api/favorites/[propertyId]", error);
  }
}

/**
 * DELETE /api/favorites/{propertyId}
 *
 * Quita una propiedad de la lista. Responde igual estuviera guardada o no:
 * el resultado deseado —que no lo esté— se cumple en ambos casos, y así lo
 * define HTTP para `DELETE`.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/favorites/[propertyId]">,
) {
  try {
    const session = await requireStandardUser();

    if (!session.ok) {
      return session.response;
    }

    const { propertyId } = await context.params;

    await removeFavorite(session.user.id, propertyId);

    return jsonOk({ message: "Propiedad quitada de tus guardadas." });
  } catch (error) {
    return jsonInternalError("DELETE /api/favorites/[propertyId]", error);
  }
}
