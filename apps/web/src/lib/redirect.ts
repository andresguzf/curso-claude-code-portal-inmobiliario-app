/**
 * Destino seguro tras iniciar sesión.
 *
 * Solo se aceptan rutas de este mismo sitio. Sin esta comprobación, un enlace
 * como `/login?next=https://sitio-falso.cl` llevaría a la persona a otro
 * dominio justo después de autenticarse, que es el momento en que más
 * confianza tiene en lo que ve.
 */
export const DEFAULT_REDIRECT_PATH = "/";

export function sanitizeRedirectPath(value: string | undefined | null): string {
  if (typeof value !== "string" || !value.startsWith("/")) {
    return DEFAULT_REDIRECT_PATH;
  }

  // `//otro-dominio.cl` y `/\otro-dominio.cl` son rutas relativas al
  // protocolo: el navegador las resuelve como externas.
  if (value.startsWith("//") || value.startsWith("/\\")) {
    return DEFAULT_REDIRECT_PATH;
  }

  return value;
}
