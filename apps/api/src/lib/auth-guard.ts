import { cookies } from "next/headers";

import { UserRole, type AuthenticatedUserDto } from "@portal/contracts";

import { HTTP_STATUS, jsonError, type ApiErrorBody } from "@/lib/api-response";
import { SESSION_COOKIE_NAME } from "@/lib/session";
import { getAuthenticatedUser } from "@/services/auth-service";

import type { NextResponse } from "next/server";

/**
 * Guardas de autorización para los Route Handlers (spec.md, sección 21).
 *
 * La autorización se comprueba siempre aquí, en el servidor. Que la interfaz
 * esconda un botón no impide a nadie llamar a la API: esconderlo es cortesía,
 * esto es la protección.
 *
 * Cada guarda devuelve el usuario o la respuesta HTTP con la que cortar. El
 * Route Handler decide qué hacer, pero no puede olvidarse de comprobar: el
 * tipo del resultado le obliga a distinguir ambos casos.
 */

export type GuardResult =
  | { readonly ok: true; readonly user: AuthenticatedUserDto }
  | { readonly ok: false; readonly response: NextResponse<ApiErrorBody> };

/**
 * Exige una sesión válida.
 *
 * El rol y el estado de la cuenta se releen de PostgreSQL en cada llamada, de
 * modo que desactivar a alguien lo deje fuera en el acto.
 */
export async function requireAuthenticatedUser(): Promise<GuardResult> {
  const sessionCookie = (await cookies()).get(SESSION_COOKIE_NAME);
  const user = await getAuthenticatedUser(sessionCookie?.value);

  if (user === null) {
    return {
      ok: false,
      response: jsonError(
        "No hay una sesión iniciada.",
        HTTP_STATUS.UNAUTHORIZED,
      ),
    };
  }

  return { ok: true, user };
}

/**
 * Exige una sesión con rol ADMIN.
 *
 * Distingue 401 de 403 a propósito: quien no ha entrado puede resolverlo
 * iniciando sesión, y quien ya entró necesita saber que su cuenta no basta.
 * Confundirlos llevaría a un USER a un formulario de login que no arregla
 * nada.
 */
export async function requireAdmin(): Promise<GuardResult> {
  const session = await requireAuthenticatedUser();

  if (!session.ok) {
    return session;
  }

  if (session.user.role !== UserRole.ADMIN) {
    return {
      ok: false,
      response: jsonError(
        "No tienes permiso para acceder a este recurso.",
        HTTP_STATUS.FORBIDDEN,
      ),
    };
  }

  return session;
}
