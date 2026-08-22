/**
 * Cabeceras de seguridad del backend (spec.md, sección 24b).
 *
 * Esta aplicación solo devuelve JSON, así que su política puede ser mucho más
 * estricta que la del portal: nada de lo que responde debe cargar un recurso,
 * ejecutar un script ni mostrarse dentro de un marco.
 *
 * Se declaran aquí y no solo en el frontend porque el backend es alcanzable
 * por su cuenta: el proxy es una comodidad del despliegue, no una barrera.
 */

export type SecurityHeader = { readonly key: string; readonly value: string };

export function buildApiSecurityHeaders(
  isDevelopment: boolean = process.env.NODE_ENV !== "production",
): SecurityHeader[] {
  return [
    // Una respuesta JSON no carga nada: `'none'` describe exactamente eso.
    {
      key: "Content-Security-Policy",
      value: "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    },
    { key: "X-Frame-Options", value: "DENY" },
    // Sin `nosniff`, un JSON con contenido controlado por quien lo envió
    // puede acabar interpretado como HTML por un navegador antiguo.
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "no-referrer" },
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
