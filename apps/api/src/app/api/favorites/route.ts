import type { PropertyListDto } from "@portal/contracts";

import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { requireStandardUser } from "@/lib/auth-guard";
import { listFavorites } from "@/services/favorite-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/favorites
 *
 * Propiedades guardadas por quien tiene la sesión, de la más reciente a la
 * más antigua. La lista es siempre la suya: el identificador sale de la
 * sesión, nunca de un parámetro (spec.md, sección 16).
 */
export async function GET() {
  try {
    const session = await requireStandardUser();

    if (!session.ok) {
      return session.response;
    }

    return jsonOk<PropertyListDto>(await listFavorites(session.user.id));
  } catch (error) {
    return jsonInternalError("GET /api/favorites", error);
  }
}
