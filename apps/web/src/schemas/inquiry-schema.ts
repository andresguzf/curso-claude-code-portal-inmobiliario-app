import { z } from "zod";

import { INQUIRY_LIMITS } from "@portal/contracts";

/**
 * Validación del formulario de contacto (spec.md, sección 14).
 *
 * Las cotas salen del contrato compartido, de modo que el navegador y el
 * backend rechacen lo mismo. Aquí los mensajes están redactados para leerse
 * junto al campo: son para quien escribe, no para quien depura.
 *
 * Validar en el navegador es comodidad, no seguridad. La comprobación que
 * manda es la del backend, porque la API es pública.
 */
export const inquirySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Escribe tu nombre.")
    .max(INQUIRY_LIMITS.maxNameLength, "El nombre es demasiado largo."),
  email: z
    .email("Revisa tu email: parece incompleto.")
    .max(INQUIRY_LIMITS.maxEmailLength, "El email es demasiado largo."),
  phone: z
    .string()
    .trim()
    .max(INQUIRY_LIMITS.maxPhoneLength, "El teléfono es demasiado largo.")
    .optional(),
  message: z
    .string()
    .trim()
    .min(
      INQUIRY_LIMITS.minMessageLength,
      `Cuéntanos algo más: al menos ${INQUIRY_LIMITS.minMessageLength} caracteres.`,
    )
    .max(INQUIRY_LIMITS.maxMessageLength, "El mensaje es demasiado largo."),
});

export type InquiryFormValues = z.infer<typeof inquirySchema>;
