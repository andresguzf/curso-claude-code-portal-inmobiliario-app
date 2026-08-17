import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { parsePropertyListQuery } from "@/services/property-query";
import { listPublicProperties } from "@/services/property-service";

/** Los datos provienen de PostgreSQL en cada solicitud. */
export const dynamic = "force-dynamic";

/**
 * GET /api/properties
 *
 * Devuelve las propiedades publicadas (spec.md, sección 8), aplicando la
 * búsqueda textual y los filtros combinados de la URL (secciones 9 y 10).
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = parsePropertyListQuery(searchParams);

    if (!parsed.ok) {
      return jsonError(parsed.message, HTTP_STATUS.BAD_REQUEST);
    }

    return jsonOk(await listPublicProperties(parsed.query));
  } catch (error) {
    return jsonInternalError("GET /api/properties", error);
  }
}
