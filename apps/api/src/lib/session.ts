import { jwtVerify, SignJWT } from "jose";

import { SESSION_COOKIE_NAME } from "@portal/contracts";

/**
 * Sesión del usuario autenticado (plan.md, sección 10).
 *
 * La sesión viaja en una cookie `httpOnly`, no en `localStorage`: así el
 * JavaScript de la página no puede leerla, que es justo lo que exige
 * `spec.md`, sección 15.
 *
 * El testigo solo lleva el identificador del usuario. El rol y el estado de
 * la cuenta se releen de PostgreSQL en cada petición, de modo que desactivar
 * a alguien o cambiarle el rol surta efecto de inmediato y no cuando caduque
 * su sesión.
 */

export { SESSION_COOKIE_NAME };

/** Una semana: suficiente para no reautenticarse a diario. */
export const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

const TOKEN_ALGORITHM = "HS256";
const TOKEN_ISSUER = "portal-inmobiliario";

/**
 * Secreto de firma.
 *
 * Lanza si falta en lugar de recurrir a un valor por defecto: un secreto
 * predecible convierte la sesión en algo que cualquiera puede fabricar, y es
 * preferible que la autenticación no arranque a que arranque sin proteger.
 */
export function readAuthSecret(
  environmentValue: string | undefined = process.env.AUTH_SECRET,
): Uint8Array {
  const secret = environmentValue?.trim() ?? "";

  if (secret === "") {
    throw new Error("AUTH_SECRET no está configurado.");
  }

  return new TextEncoder().encode(secret);
}

export function createSessionToken(
  userId: string,
  secret: Uint8Array = readAuthSecret(),
): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: TOKEN_ALGORITHM })
    .setSubject(userId)
    .setIssuer(TOKEN_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(secret);
}

/**
 * Identificador del usuario que firma el testigo, o `null` si no es válido.
 *
 * Un testigo caducado, manipulado o firmado con otro secreto se trata igual
 * que la ausencia de sesión: no hay usuario.
 */
export async function readSessionToken(
  token: string | undefined,
  secret: Uint8Array = readAuthSecret(),
): Promise<string | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: [TOKEN_ALGORITHM],
      issuer: TOKEN_ISSUER,
    });

    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/**
 * Opciones de la cookie de sesión.
 *
 * `sameSite: "lax"` basta porque el navegador ve un solo origen: el frontend
 * reescribe `/api/*` hacia el backend (plan.md, sección 4).
 */
export function buildSessionCookieOptions(
  isProduction: boolean = process.env.NODE_ENV === "production",
) {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: isProduction,
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  } as const;
}
