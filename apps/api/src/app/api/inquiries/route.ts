import type { InquiryCreatedDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { createInquiry } from "@/services/inquiry-service";

/** Cada consulta se procesa en el momento. */
export const dynamic = "force-dynamic";

/**
 * POST /api/inquiries
 *
 * Valida una consulta sobre una propiedad publicada. El correo lo envía
 * después el navegador mediante Web3Forms, que no acepta envíos desde el
 * servidor en su plan gratuito (plan.md, sección 13).
 *
 * Una propiedad inexistente y una despublicada responden ambas 404, como en
 * el resto de la API pública: el formulario no puede convertirse en la vía
 * para averiguar qué borradores existen.
 */
export async function POST(request: Request) {
  try {
    const payload: unknown = await request.json().catch(() => null);
    const outcome = await createInquiry(payload);

    switch (outcome.status) {
      case "accepted":
        return jsonOk<InquiryCreatedDto>(
          { message: "Consulta enviada. Te responderemos a la brevedad." },
          HTTP_STATUS.CREATED,
        );

      case "invalid":
        return jsonError(outcome.message, HTTP_STATUS.BAD_REQUEST);

      case "property-not-found":
        return jsonError("Propiedad no encontrada.", HTTP_STATUS.NOT_FOUND);
    }
  } catch (error) {
    return jsonInternalError("POST /api/inquiries", error);
  }
}
