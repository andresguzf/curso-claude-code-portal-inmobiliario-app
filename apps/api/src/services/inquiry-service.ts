import "server-only";

import { findPropertyById } from "@/repositories/property-repository";
import { validateInquiry } from "@/services/inquiry-validation";

/**
 * Consultas sobre una propiedad (spec.md, sección 14).
 *
 * Solo se admiten consultas sobre propiedades publicadas: un borrador no es
 * visible en el portal, así que tampoco puede ser objeto de una consulta.
 *
 * El correo no sale de aquí. Web3Forms rechaza los envíos desde el servidor
 * en su plan gratuito, así que lo envía el navegador después de que esta
 * validación pase (plan.md, sección 13). El paso 21 añadirá la persistencia
 * en PostgreSQL y la asociación con el usuario autenticado.
 */

const PUBLIC_SCOPE = { isPublished: true } as const;

export type InquiryOutcome =
  | { readonly status: "accepted" }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "property-not-found" };

export async function createInquiry(payload: unknown): Promise<InquiryOutcome> {
  const validation = validateInquiry(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const property = await findPropertyById(
    validation.inquiry.propertyId,
    PUBLIC_SCOPE,
  );

  if (!property) {
    return { status: "property-not-found" };
  }

  return { status: "accepted" };
}
