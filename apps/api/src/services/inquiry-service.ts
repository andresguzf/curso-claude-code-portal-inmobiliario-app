import "server-only";

import { INQUIRIES_PER_PAGE, type UserInquiryPageDto } from "@portal/contracts";

import {
  createInquiry as insertInquiry,
  findUserInquiries,
  hideInquiryFromUser,
} from "@/repositories/inquiry-repository";
import { findPropertyById } from "@/repositories/property-repository";
import { validateInquiry } from "@/services/inquiry-validation";

/**
 * Consultas sobre una propiedad (spec.md, sección 14).
 *
 * Solo se admiten consultas sobre propiedades publicadas: un borrador no es
 * visible en el portal, así que tampoco puede ser objeto de una consulta.
 *
 * La consulta se guarda antes de que salga ningún correo, y por eso un fallo
 * de Web3Forms ya no la pierde: queda registrada para que la inmobiliaria
 * pueda responder igualmente.
 *
 * El correo no sale de aquí. Web3Forms rechaza los envíos desde el servidor
 * en su plan gratuito, así que lo envía el navegador una vez que esta
 * validación ha pasado y la consulta está guardada (plan.md, sección 13).
 */

const PUBLIC_SCOPE = { isPublished: true } as const;

export type InquiryOutcome =
  | { readonly status: "created"; readonly id: string }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "property-not-found" };

/**
 * Registra una consulta.
 *
 * `userId` llega de la sesión y es nulo para un visitante: el portal admite
 * consultas sin cuenta, y quien la tiene ve luego en su cuenta por qué
 * propiedades ha escrito.
 */
export async function createInquiry(
  payload: unknown,
  userId: string | null,
): Promise<InquiryOutcome> {
  const validation = validateInquiry(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const inquiry = validation.inquiry;
  const property = await findPropertyById(inquiry.propertyId, PUBLIC_SCOPE);

  if (!property) {
    return { status: "property-not-found" };
  }

  const { id } = await insertInquiry({
    propertyId: property.id,
    userId,
    name: inquiry.name,
    email: inquiry.email,
    phone: inquiry.phone ?? null,
    message: inquiry.message,
  });

  return { status: "created", id };
}

/**
 * Historial de solicitudes de una persona (spec.md, sección 17).
 *
 * La página se acota aquí y no en el navegador: traer el historial entero
 * para mostrar seis entradas crece con cada consulta enviada.
 */
export async function listUserInquiries(
  userId: string,
  options: { readonly search?: string; readonly page?: number } = {},
): Promise<UserInquiryPageDto> {
  const page = normalizePage(options.page);
  const search = (options.search ?? "").trim();

  const { inquiries, total } = await findUserInquiries(userId, {
    search,
    skip: (page - 1) * INQUIRIES_PER_PAGE,
    take: INQUIRIES_PER_PAGE,
  });

  return {
    data: inquiries.map((inquiry) => ({
      id: inquiry.id,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      property: {
        id: inquiry.property.id,
        title: inquiry.property.title,
        imageUrl: inquiry.property.images[0]?.url ?? null,
      },
    })),
    total,
    page,
    pageSize: INQUIRIES_PER_PAGE,
  };
}

export type HideInquiryOutcome =
  { readonly status: "hidden" } | { readonly status: "not-found" };

/**
 * Oculta una solicitud del historial propio.
 *
 * No la borra: la solicitud sigue disponible para ADMIN, porque es el
 * contacto que la inmobiliaria debe responder (spec.md, sección 17).
 *
 * Una solicitud ajena o ya oculta responde igual que una inexistente: no se
 * confirma que exista algo que no es de quien pregunta.
 */
export async function hideInquiry(
  inquiryId: string,
  userId: string,
): Promise<HideInquiryOutcome> {
  const hidden = await hideInquiryFromUser(inquiryId, userId);

  return hidden > 0 ? { status: "hidden" } : { status: "not-found" };
}

/** Una página fuera de rango se trata como la primera. */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}
