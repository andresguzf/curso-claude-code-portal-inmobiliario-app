import type { AdminFeatureDto, FeatureListDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { addFeature, listFeatures } from "@/services/feature-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/features
 *
 * Opciones del formulario de propiedad y listado de la sección que las
 * administra. Vive bajo `/admin` porque solo la administración las necesita:
 * el catálogo público muestra las características de cada propiedad, no la
 * lista completa.
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

/**
 * POST /api/admin/features
 *
 * Da de alta una característica. El identificador lo deriva el servidor del
 * nombre: es el que usan las propiedades para conectarse, y dejarlo escribir
 * invitaría a inventar uno que no case con el resto (spec.md, sección 4).
 */
export async function POST(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await addFeature(payload);

    switch (outcome.status) {
      case "ok":
        return jsonOk<AdminFeatureDto>(outcome.feature, HTTP_STATUS.CREATED);

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "duplicate":
        return jsonError(outcome.message, HTTP_STATUS.CONFLICT);

      case "not-found":
        return jsonError(
          "Característica no encontrada.",
          HTTP_STATUS.NOT_FOUND,
        );
    }
  } catch (error) {
    return jsonInternalError("POST /api/admin/features", error);
  }
}
