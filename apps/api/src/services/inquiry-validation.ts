import { INQUIRY_LIMITS, type InquiryRequestDto } from "@portal/contracts";

/**
 * Validación de una consulta recibida por la API (spec.md, sección 14).
 *
 * El formulario ya valida en el navegador, pero eso es comodidad, no
 * seguridad: la API es pública y cualquiera puede llamarla sin pasar por el
 * formulario. Estas comprobaciones son las que mandan.
 *
 * Se escriben a mano, como el resto de validaciones del backend
 * (`property-query.ts`), para no arrastrar un esquema al paquete de
 * contratos, que es TypeScript plano y sin dependencias.
 */

export type InquiryValidationResult =
  | { readonly ok: true; readonly inquiry: InquiryRequestDto }
  | { readonly ok: false; readonly message: string };

/**
 * Correo electrónico aceptable.
 *
 * Deliberadamente laxa: la única comprobación concluyente de un correo es
 * enviarle un mensaje. Una expresión estricta rechaza direcciones válidas y
 * no detiene a quien escribe una falsa.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(payload: unknown): InquiryValidationResult {
  if (typeof payload !== "object" || payload === null) {
    return { ok: false, message: "El cuerpo de la solicitud es inválido." };
  }

  const { propertyId, name, email, phone, message } = payload as Record<
    string,
    unknown
  >;

  const propertyIdValue = readText(propertyId);

  if (propertyIdValue === "") {
    return { ok: false, message: "La propiedad consultada es obligatoria." };
  }

  const nameValue = readText(name);

  if (nameValue === "") {
    return { ok: false, message: "El nombre es obligatorio." };
  }

  if (nameValue.length > INQUIRY_LIMITS.maxNameLength) {
    return { ok: false, message: "El nombre es demasiado largo." };
  }

  const emailValue = readText(email);

  if (emailValue === "") {
    return { ok: false, message: "El email es obligatorio." };
  }

  if (
    emailValue.length > INQUIRY_LIMITS.maxEmailLength ||
    !EMAIL_PATTERN.test(emailValue)
  ) {
    return { ok: false, message: "El email no es válido." };
  }

  const phoneValue = readText(phone);

  if (phoneValue.length > INQUIRY_LIMITS.maxPhoneLength) {
    return { ok: false, message: "El teléfono es demasiado largo." };
  }

  const messageValue = readText(message);

  if (messageValue.length < INQUIRY_LIMITS.minMessageLength) {
    return {
      ok: false,
      message: `El mensaje debe tener al menos ${INQUIRY_LIMITS.minMessageLength} caracteres.`,
    };
  }

  if (messageValue.length > INQUIRY_LIMITS.maxMessageLength) {
    return { ok: false, message: "El mensaje es demasiado largo." };
  }

  return {
    ok: true,
    inquiry: {
      propertyId: propertyIdValue,
      name: nameValue,
      email: emailValue,
      phone: phoneValue === "" ? undefined : phoneValue,
      message: messageValue,
    },
  };
}

/** Un valor que no sea texto se trata como ausente, no como error de tipo. */
function readText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
