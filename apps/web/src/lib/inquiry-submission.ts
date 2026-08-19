import type { InquiryRequestDto } from "@portal/contracts";

import { submitInquiry } from "@/lib/api-client";
import { deliverInquiry } from "@/lib/web3forms";

/**
 * Envío completo de una consulta (plan.md, sección 13).
 *
 * Son dos pasos, y en este orden:
 *
 * 1. la API valida la consulta y la **guarda** en PostgreSQL;
 * 2. Web3Forms envía el correo a la inmobiliaria.
 *
 * La API va primero por dos motivos. Su validación es la que manda, así que
 * no debe salir un correo por una consulta que el backend rechaza. Y una vez
 * guardada, la consulta ya no se pierde: si el correo falla, sigue ahí para
 * que la inmobiliaria pueda responder.
 *
 * Por eso el fallo del correo no se comunica como un fracaso ni invita a
 * reintentar: reintentar guardaría la consulta dos veces.
 */

export type InquiryResult = {
  readonly message: string;
  /** `false` si la consulta quedó guardada pero el correo no salió. */
  readonly isEmailDelivered: boolean;
};

const SAVED_BUT_NOT_EMAILED =
  "Recibimos tu consulta y quedó registrada. No pudimos enviar el aviso por correo, pero te responderemos igualmente.";

export async function sendInquiry(
  inquiry: InquiryRequestDto,
  propertyTitle: string,
): Promise<InquiryResult> {
  // Un rechazo de la API llega como excepción con su mensaje: se propaga tal
  // cual, porque explica qué corregir, y ahí sí procede reintentar.
  const created = await submitInquiry(inquiry);
  const delivery = await deliverInquiry(inquiry, propertyTitle);

  if (delivery.status === "delivered") {
    return { message: created.message, isEmailDelivered: true };
  }

  // El motivo técnico queda en la consola; quien escribió necesita saber que
  // su consulta está a salvo.
  console.error(
    `[consulta] ${created.id} guardada, pero el correo no salió:`,
    delivery.status === "failed" ? delivery.reason : "sin clave configurada",
  );

  return { message: SAVED_BUT_NOT_EMAILED, isEmailDelivered: false };
}
