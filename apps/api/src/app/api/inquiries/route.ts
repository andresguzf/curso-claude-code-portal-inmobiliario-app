import { cookies } from "next/headers";

import type { InquiryCreatedDto, UserInquiryPageDto } from "@portal/contracts";

import {
  HTTP_STATUS,
  jsonError,
  jsonInternalError,
  jsonOk,
} from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth-guard";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { getAuthenticatedUser } from "@/services/auth-service";
import { createInquiry, listUserInquiries } from "@/services/inquiry-service";

/** Cada consulta se procesa en el momento. */
export const dynamic = "force-dynamic";

/**
 * POST /api/inquiries
 *
 * Registra una consulta sobre una propiedad publicada y la asocia a quien
 * tiene sesión, si la hay: el portal admite consultas de visitantes
 * (spec.md, sección 14).
 *
 * La consulta se guarda antes de que salga ningún correo. El envío lo hace
 * después el navegador mediante Web3Forms, que no acepta peticiones desde el
 * servidor en su plan gratuito (plan.md, sección 13).
 *
 * Una propiedad inexistente y una despublicada responden ambas 404, como en
 * el resto de la API pública: el formulario no puede convertirse en la vía
 * para averiguar qué borradores existen.
 */
export async function POST(request: Request) {
  try {
    // La sesión es opcional: sin ella la consulta se guarda sin usuario.
    const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME);
    const user = await getAuthenticatedUser(sessionCookie?.value);

    const payload: unknown = await request.json().catch(() => null);
    const outcome = await createInquiry(payload, user?.id ?? null);

    switch (outcome.status) {
      case "created":
        return jsonOk<InquiryCreatedDto>(
          {
            id: outcome.id,
            message: "Consulta enviada. Te responderemos a la brevedad.",
          },
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

/**
 * GET /api/inquiries?search=&page=
 *
 * Historial de solicitudes de quien tiene la sesión, paginado y filtrable.
 * La lista es siempre la suya: el identificador sale de la sesión, no de un
 * parámetro, así que no hay nada que manipular para leer la de otra persona.
 */
export async function GET(request: Request) {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    const parameters = new URL(request.url).searchParams;

    return jsonOk<UserInquiryPageDto>(
      await listUserInquiries(session.user.id, {
        search: parameters.get("search") ?? "",
        page: Number(parameters.get("page")) || 1,
      }),
    );
  } catch (error) {
    return jsonInternalError("GET /api/inquiries", error);
  }
}
