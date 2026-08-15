import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { listPublicProperties } from "@/services/property-service";

/** Los datos provienen de PostgreSQL en cada solicitud. */
export const dynamic = "force-dynamic";

/**
 * GET /api/properties
 *
 * Devuelve las propiedades publicadas (spec.md, sección 8).
 */
export async function GET() {
  try {
    return jsonOk(await listPublicProperties());
  } catch (error) {
    return jsonInternalError("GET /api/properties", error);
  }
}
