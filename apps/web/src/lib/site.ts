/**
 * Identidad pública del sitio, para la metadata (spec.md, sección 25).
 *
 * Open Graph exige URLs absolutas: una imagen relativa no la resuelve el
 * servidor de Facebook o WhatsApp que lee la etiqueta. `metadataBase` deja
 * que Next las complete, y esta es la base que usa.
 */

export const SITE_NAME = "Portal Inmobiliario";

export const SITE_DESCRIPTION =
  "Encuentra propiedades en venta y arriendo: casas, departamentos, terrenos y oficinas.";

/**
 * URL pública del portal.
 *
 * En desarrollo cae en `localhost`, que es donde está. En producción hay que
 * declararla: sin ella, las tarjetas compartidas apuntarían a la máquina de
 * quien desplegó.
 */
export function resolveSiteUrl(
  rawUrl: string | undefined = process.env.SITE_URL,
): URL {
  const trimmed = rawUrl?.trim();

  if (!trimmed) {
    return new URL("http://localhost:3000");
  }

  try {
    return new URL(trimmed);
  } catch {
    // Una URL mal escrita no debe tumbar el renderizado de todas las
    // páginas: se avisa y se sigue con la de desarrollo.
    console.error(
      `[seo] SITE_URL no es una URL válida: ${trimmed}`,
    );

    return new URL("http://localhost:3000");
  }
}
