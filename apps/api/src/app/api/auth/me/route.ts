import type { AuthenticatedUserDto } from "@portal/contracts";

import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { requireAuthenticatedUser } from "@/lib/auth-guard";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/me
 *
 * Devuelve el usuario de la sesión vigente. El rol y el estado de la cuenta
 * se releen de PostgreSQL en cada llamada, así que desactivar a alguien lo
 * deja fuera de inmediato aunque su testigo siga sin caducar.
 */
export async function GET() {
  try {
    const session = await requireAuthenticatedUser();

    if (!session.ok) {
      return session.response;
    }

    return jsonOk<AuthenticatedUserDto>(session.user);
  } catch (error) {
    return jsonInternalError("GET /api/auth/me", error);
  }
}
