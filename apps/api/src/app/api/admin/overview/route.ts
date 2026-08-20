import type { AdminOverviewDto } from "@portal/contracts";

import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { getAdminOverview } from "@/services/admin-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/overview
 *
 * Indicadores del panel. Exige rol ADMIN: un USER autenticado recibe 403 y
 * quien no ha entrado, 401. La comprobación es del backend, no de la
 * interfaz (spec.md, sección 21).
 */
export async function GET() {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    return jsonOk<AdminOverviewDto>(await getAdminOverview());
  } catch (error) {
    return jsonInternalError("GET /api/admin/overview", error);
  }
}
