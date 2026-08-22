/**
 * Cabeceras de seguridad del portal (spec.md, sección 24b).
 *
 * Se declaran en `next.config.ts` y no en el middleware: así se aplican
 * también a lo que el middleware no ve —los archivos estáticos— y no cuesta
 * una ejecución por petición.
 *
 * Van en las dos aplicaciones. El navegador solo habla con el frontend, pero
 * el backend es alcanzable por su cuenta en cuanto comparta red con algo, y
 * una cabecera que solo protege la mitad del sistema protege la mitad.
 */

/**
 * Orígenes de los que el navegador puede traer cada tipo de recurso.
 *
 * Los de Google Maps son más de los que sugiere el script inicial: una vez
 * cargado, el mapa trae sus teselas de varios subdominios de `googleapis.com`
 * y de `gstatic.com`, y pide la tipografía Roboto a Google Fonts. Declarar
 * solo `maps.googleapis.com` deja el mapa a medio pintar en cuanto la clave
 * tenga permisos para dibujarlo.
 */
const GOOGLE_MAPS_SCRIPTS = "https://maps.googleapis.com";
const GOOGLE_MAPS_IMAGES = [
  "https://maps.googleapis.com",
  "https://maps.gstatic.com",
  // Las teselas salen de `khms0`, `khms1`… y de otros subdominios rotatorios.
  "https://*.googleapis.com",
  "https://*.gstatic.com",
  "https://*.ggpht.com",
  "https://*.googleusercontent.com",
].join(" ");
const GOOGLE_FONTS_STYLES = "https://fonts.googleapis.com";
const GOOGLE_FONTS_FILES = "https://fonts.gstatic.com";
const IMAGE_HOSTS =
  "https://res.cloudinary.com https://picsum.photos https://images.unsplash.com";
const WEB3FORMS = "https://api.web3forms.com";

/**
 * Política de contenido.
 *
 * `'unsafe-inline'` en los estilos es inevitable sin un *nonce* por petición:
 * Next inyecta estilos en línea en cada página que sirve. En desarrollo se
 * añade `'unsafe-eval'`, que exige la recarga en caliente y que en producción
 * no se concede.
 *
 * Cerrar ambas puertas obligaría a pasar cada respuesta por el middleware
 * para sellarle un `nonce`, y a que ningún estilo de Next se escapara. Es la
 * evolución natural de esta política, no su estado actual.
 */
export function buildContentSecurityPolicy(
  isDevelopment: boolean = process.env.NODE_ENV !== "production",
): string {
  const scriptSources = [
    "'self'",
    "'unsafe-inline'",
    GOOGLE_MAPS_SCRIPTS,
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ].join(" ");

  return [
    "default-src 'self'",
    `script-src ${scriptSources}`,
    `style-src 'self' 'unsafe-inline' ${GOOGLE_FONTS_STYLES}`,
    `img-src 'self' data: blob: ${IMAGE_HOSTS} ${GOOGLE_MAPS_IMAGES}`,
    `font-src 'self' data: ${GOOGLE_FONTS_FILES}`,
    `connect-src 'self' ${WEB3FORMS} ${GOOGLE_MAPS_IMAGES}`,
    // El mapa vectorial dibuja en un trabajador creado desde un `blob:`.
    // Sin esta línea recae en `default-src` y el mapa se queda en blanco.
    "worker-src 'self' blob:",
    // Nada de este portal se incrusta, y nada de fuera se incrusta en él.
    "frame-src 'none'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    // Sin esto, una etiqueta inyectada podría reescribir a dónde apuntan
    // todas las rutas relativas de la página.
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
}

export type SecurityHeader = { readonly key: string; readonly value: string };

/**
 * Las cabeceras que acompañan a toda respuesta.
 *
 * `Strict-Transport-Security` solo en producción: en local se sirve por
 * `http`, y anunciar que el sitio es solo `https` dejaría `localhost`
 * inaccesible en ese navegador durante el año siguiente.
 */
export function buildSecurityHeaders(
  isDevelopment: boolean = process.env.NODE_ENV !== "production",
): SecurityHeader[] {
  return [
    {
      key: "Content-Security-Policy",
      value: buildContentSecurityPolicy(isDevelopment),
    },
    // Redundante con `frame-ancestors` en un navegador al día, y la red de
    // seguridad en uno que no lo esté.
    { key: "X-Frame-Options", value: "DENY" },
    { key: "X-Content-Type-Options", value: "nosniff" },
    // Al salir del sitio se anuncia el origen, nunca la ruta: un enlace desde
    // `/admin/users/{id}` no debe contarle a nadie qué se estaba mirando.
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value: "camera=(), microphone=(), geolocation=(), payment=()",
    },
    ...(isDevelopment
      ? []
      : [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ]),
  ];
}
