import type { InquiryRequestDto } from "@portal/contracts";

/**
 * Envío de consultas mediante Web3Forms (plan.md, sección 13).
 *
 * La llamada sale del navegador porque Web3Forms no admite otra cosa en su
 * plan gratuito: una petición desde el servidor responde 403 con «Use our API
 * in client side».
 *
 * Su clave de acceso es pública por diseño —Web3Forms la publica en el HTML
 * de cada formulario que la usa— y no da acceso a ninguna cuenta: solo
 * permite enviar al correo configurado.
 */

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";

/** Web3Forms no debe dejar al visitante esperando indefinidamente. */
const WEB3FORMS_TIMEOUT_MS = 10_000;

export type DeliveryResult =
  | { readonly status: "delivered" }
  | { readonly status: "not-configured" }
  | { readonly status: "failed"; readonly reason: string };

export function readWeb3FormsAccessKey(
  environmentValue: string | undefined = process.env
    .NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY,
): string | null {
  const accessKey = environmentValue?.trim() ?? "";

  return accessKey === "" ? null : accessKey;
}

/**
 * Cuerpo que recibe Web3Forms.
 *
 * El título es el que la API devolvió con la propiedad, no uno tecleado en el
 * formulario: quien recibe el correo lee el título real.
 */
export function buildWeb3FormsPayload(
  inquiry: InquiryRequestDto,
  propertyTitle: string,
  accessKey: string,
): Record<string, string> {
  return {
    access_key: accessKey,
    subject: `Consulta sobre ${propertyTitle}`,
    from_name: "Portal Inmobiliario",
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? "No indicado",
    message: inquiry.message,
    Propiedad: propertyTitle,
    "ID de propiedad": inquiry.propertyId,
  };
}

export async function deliverInquiry(
  inquiry: InquiryRequestDto,
  propertyTitle: string,
): Promise<DeliveryResult> {
  const accessKey = readWeb3FormsAccessKey();

  if (accessKey === null) {
    return { status: "not-configured" };
  }

  try {
    const response = await fetch(WEB3FORMS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(
        buildWeb3FormsPayload(inquiry, propertyTitle, accessKey),
      ),
      signal: AbortSignal.timeout(WEB3FORMS_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { status: "failed", reason: `HTTP ${response.status}` };
    }

    const body: unknown = await response.json();
    const succeeded =
      typeof body === "object" &&
      body !== null &&
      (body as { success?: unknown }).success === true;

    // Web3Forms puede responder 200 con `success: false`; tomar el código
    // HTTP como única señal daría por enviada una consulta que no salió.
    return succeeded
      ? { status: "delivered" }
      : { status: "failed", reason: "Web3Forms rechazó la consulta." };
  } catch (error) {
    return {
      status: "failed",
      reason: error instanceof Error ? error.message : "Error desconocido",
    };
  }
}
