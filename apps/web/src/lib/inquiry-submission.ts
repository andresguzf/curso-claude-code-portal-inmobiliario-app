import type { InquiryRequestDto } from "@portal/contracts";

import { submitInquiry } from "@/lib/api-client";
import { deliverInquiry } from "@/lib/web3forms";

/**
 * Envío completo de una consulta (plan.md, sección 13).
 *
 * Son dos pasos, y en este orden:
 *
 * 1. la API valida la consulta y comprueba que la propiedad esté publicada;
 * 2. Web3Forms envía el correo a la inmobiliaria.
 *
 * La API va primero porque su validación es la que manda: no debe salir un
 * correo por una consulta que el backend rechaza. Y el correo va aparte
 * porque Web3Forms no acepta envíos desde el servidor en su plan gratuito.
 */
export async function sendInquiry(
  inquiry: InquiryRequestDto,
  propertyTitle: string,
): Promise<{ readonly message: string }> {
  // Un rechazo de la API llega como excepción con su mensaje: se propaga tal
  // cual, porque explica qué corregir.
  const accepted = await submitInquiry(inquiry);
  const delivery = await deliverInquiry(inquiry, propertyTitle);

  if (delivery.status === "not-configured") {
    throw new Error(
      "El envío de consultas no está disponible en este momento.",
    );
  }

  if (delivery.status === "failed") {
    // El motivo técnico queda en la consola; quien escribió necesita saber
    // qué hacer, no qué falló.
    console.error(`[consulta] Web3Forms falló: ${delivery.reason}`);

    throw new Error(
      "No pudimos enviar tu consulta. Vuelve a intentarlo en unos minutos.",
    );
  }

  return accepted;
}
