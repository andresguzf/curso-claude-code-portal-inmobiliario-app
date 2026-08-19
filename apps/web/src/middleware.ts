import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE_NAME } from "@portal/contracts";

/**
 * Primera barrera de las rutas privadas (spec.md, sección 21).
 *
 * Solo comprueba que exista la cookie de sesión, no que sea válida: el
 * frontend no tiene el secreto de firma y no debe tenerlo. Esto evita cargar
 * una página privada a quien claramente no ha entrado, y ahorra el viaje a la
 * API en el caso más común.
 *
 * La comprobación que manda es la de la página, que pregunta al backend quién
 * es la persona y con qué rol. Un testigo caducado o falsificado pasa por
 * aquí y muere allí.
 */
export function middleware(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);

  // Se recuerda el destino para volver a él después de entrar.
  loginUrl.searchParams.set(
    "next",
    `${request.nextUrl.pathname}${request.nextUrl.search}`,
  );

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/account/:path*", "/admin/:path*"],
};
