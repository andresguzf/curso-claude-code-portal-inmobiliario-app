import { jsonInternalError, jsonOk } from "@/lib/api-response";
import { buildSessionCookieOptions, SESSION_COOKIE_NAME } from "@/lib/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/logout
 *
 * Cierra la sesión borrando la cookie. Responde igual haya sesión o no: no
 * hay nada que informar y quien cierra sesión espera quedar fuera.
 */
export async function POST() {
  try {
    const response = jsonOk({ message: "Sesión cerrada." });

    response.cookies.set(SESSION_COOKIE_NAME, "", {
      ...buildSessionCookieOptions(),
      maxAge: 0,
    });

    return response;
  } catch (error) {
    return jsonInternalError("POST /api/auth/logout", error);
  }
}
