import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import { hideInquiry } from "@/services/inquiry-service";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/inquiries/{id}
 *
 * Quita una solicitud del historial de quien la envió. No la borra: sigue
 * disponible para ADMIN, porque es el contacto que la inmobiliaria debe
 * responder (spec.md, sección 17).
 *
 * Una solicitud ajena responde 404, igual que una inexistente: contestar 403
 * confirmaría que ese identificador existe.
 */
export async function DELETE(
  _request: Request,
  context: RouteContext<"/api/inquiries/[inquiryId]">,
) {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    const { inquiryId } = await context.params;
    const outcome = await hideInquiry(inquiryId, session.user.id);

    if (outcome.status === "not-found") {
      return jsonError("Consulta no encontrada.", HTTP_STATUS.NOT_FOUND);
    }

    return jsonOk({ message: "Consulta eliminada de tu historial." });
  } catch (error) {
    return jsonInternalError("DELETE /api/inquiries/[inquiryId]", error);
  }
}
