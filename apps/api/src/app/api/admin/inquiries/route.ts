import type { AdminInquiryPageDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAdmin } from "@/lib/auth-guard";
import { parseAdminInquiryListQuery } from "@/services/admin-inquiry-query";
import { listAdminInquiries } from "@/services/admin-inquiry-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/inquiries
 *
 * Todas las consultas recibidas, de más reciente a más antigua
 * (spec.md, sección 22). Incluye las de visitantes sin cuenta, las que su
 * autor quitó de su historial y las de propiedades que ya no están en el
 * catálogo: son contactos comerciales que hay que poder responder.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAdmin();

    if (!session.ok) {
      return session.response;
    }

    const parsed = parseAdminInquiryListQuery(
      new URL(request.url).searchParams,
    );

    if (!parsed.ok) {
      return jsonError(parsed.message, HTTP_STATUS.BAD_REQUEST);
    }

    return jsonOk<AdminInquiryPageDto>(await listAdminInquiries(parsed.query));
  } catch (error) {
    return jsonInternalError("GET /api/admin/inquiries", error);
  }
}
