import type { FavoriteIdsDto } from "@portal/contracts";

import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import { listFavoritePropertyIds } from "@/services/favorite-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/favorites/ids
 *
 * Solo los identificadores guardados. Existe para que una página con muchas
 * tarjetas sepa cuáles marcar sin traerse la ficha completa de cada
 * propiedad guardada.
 *
 * Este segmento es estático y Next lo resuelve antes que `[propertyId]`, así
 * que no lo puede tapar una propiedad: sus identificadores son cuid.
 */
export async function GET() {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    const propertyIds = await listFavoritePropertyIds(session.user.id);

    return jsonOk<FavoriteIdsDto>({ propertyIds });
  } catch (error) {
    return jsonInternalError("GET /api/favorites/ids", error);
  }
}
