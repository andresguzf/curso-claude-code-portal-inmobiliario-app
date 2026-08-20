import type { FeatureListDto } from "@portal/contracts";

import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { listFeatures } from "@/services/feature-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/features
 *
 * Opciones del formulario de propiedad. Vive bajo `/admin` porque hoy solo
 * la administración las necesita: el catálogo público muestra las
 * características de cada propiedad, no la lista completa.
 */
export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    return jsonOk<FeatureListDto>(await listFeatures());
  } catch (error) {
    return jsonInternalError("GET /api/admin/features", error);
  }
}
