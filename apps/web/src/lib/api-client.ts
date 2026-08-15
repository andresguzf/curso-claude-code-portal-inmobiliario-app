import type { PropertyListDto } from "@portal/contracts";

/**
 * Cliente de la API REST.
 *
 * La interfaz nunca consulta PostgreSQL: siempre pasa por `/api/**`
 * (plan.md, sección 1).
 *
 * Hay dos caminos hacia el backend según dónde se ejecute el código:
 *
 * - En el navegador la ruta es relativa. La petición llega a este mismo
 *   origen y `next.config.ts` la reescribe al backend, de modo que no hay
 *   CORS ni cookies entre sitios.
 * - En el servidor `fetch` necesita una URL absoluta, y va directo al
 *   backend mediante `API_INTERNAL_URL`, evitando el salto extra por el
 *   proxy.
 */

function removeTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, "");
}

const isBrowser = () => typeof window !== "undefined";

export function resolveApiBaseUrl(
  rawInternalUrl: string | undefined = process.env.API_INTERNAL_URL,
  runningInBrowser: boolean = isBrowser(),
): string {
  if (runningInBrowser) {
    return "";
  }

  const internalUrl = rawInternalUrl?.trim();

  if (!internalUrl) {
    throw new Error(
      "Falta la variable de entorno API_INTERNAL_URL. Revisa `.env.example`.",
    );
  }

  return removeTrailingSlashes(internalUrl);
}

export function buildApiUrl(
  path: string,
  baseUrl: string = resolveApiBaseUrl(),
): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${removeTrailingSlashes(baseUrl)}${normalizedPath}`;
}

/** Propiedades publicadas. Lanza si la API no responde correctamente. */
export async function fetchPublicProperties(): Promise<PropertyListDto> {
  const response = await fetch(buildApiUrl("/api/properties"), {
    // El catálogo cambia cuando ADMIN publica o despublica una propiedad.
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} al listar las propiedades.`,
    );
  }

  return (await response.json()) as PropertyListDto;
}
