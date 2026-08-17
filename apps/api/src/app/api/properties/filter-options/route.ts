import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { listPublicFilterOptions } from "@/services/property-service";

/** Las ubicaciones cambian cuando ADMIN publica o despublica propiedades. */
export const dynamic = "force-dynamic";

/**
 * GET /api/properties/filter-options
 *
 * Comunas, ciudades y regiones con propiedades publicadas, para poblar los
 * filtros de ubicación del catálogo (spec.md, sección 10).
 */
export async function GET() {
  try {
    return jsonOk(await listPublicFilterOptions());
  } catch (error) {
    return jsonInternalError("GET /api/properties/filter-options", error);
  }
}
