import {
  QUERY_PARAM_NAMES,
  type ApiErrorDto,
  type FavoriteIdsDto,
  type UserInquiryPageDto,
  type AuthenticatedUserDto,
  type LoginRequestDto,
  type RegisterRequestDto,
  type UpdateAccountRequestDto,
  type InquiryCreatedDto,
  type InquiryRequestDto,
  type PropertyDetailDto,
  type PropertyFilterOptionsDto,
  type PropertyListDto,
  type PropertyListQuery,
} from "@portal/contracts";

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

/**
 * Serializa los parámetros de consulta del catálogo.
 *
 * Se recorre `QUERY_PARAM_NAMES` en lugar de una lista propia: ese mapa está
 * tipado como `Record<keyof PropertyListQuery, string>`, así que agregar un
 * parámetro al contrato obliga a declararlo ahí y queda serializado sin
 * tocar esta función. Una lista aparte podía quedarse corta en silencio.
 *
 * Los valores vacíos se omiten para que la URL no acumule parámetros inertes
 * como `?search=&operation=`. Los filtros múltiples se expresan repitiendo el
 * parámetro (`?commune=Las+Condes&commune=Providencia`), que es la convención
 * de HTML y lo que espera el backend.
 */
export function buildPropertyQueryString(query: PropertyListQuery): string {
  const searchParams = new URLSearchParams();

  for (const [key, paramName] of Object.entries(QUERY_PARAM_NAMES) as [
    keyof PropertyListQuery,
    string,
  ][]) {
    const value = query[key];

    if (value === undefined || value === null) {
      continue;
    }

    for (const item of Array.isArray(value) ? value : [value]) {
      const serialized = typeof item === "string" ? item.trim() : String(item);

      if (serialized !== "") {
        searchParams.append(paramName, serialized);
      }
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

/** Propiedades publicadas. Lanza si la API no responde correctamente. */
export async function fetchPublicProperties(
  query: PropertyListQuery = {},
): Promise<PropertyListDto> {
  const path = `/api/properties${buildPropertyQueryString(query)}`;
  const response = await fetch(buildApiUrl(path), {
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

/**
 * Detalle de una propiedad publicada.
 *
 * Devuelve `null` cuando la API responde 404 y lanza ante cualquier otro
 * fallo. La distinción es importante: un 404 significa que la propiedad no
 * existe o no está publicada, mientras que un backend caído no dice nada
 * sobre la propiedad y no debe presentarse como «no encontrada».
 */
export async function fetchPublicPropertyById(
  id: string,
): Promise<PropertyDetailDto | null> {
  const response = await fetch(
    buildApiUrl(`/api/properties/${encodeURIComponent(id)}`),
    { cache: "no-store" },
  );

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} al obtener la propiedad.`,
    );
  }

  return (await response.json()) as PropertyDetailDto;
}

/** Ubicaciones disponibles para los filtros del catálogo. */
export async function fetchFilterOptions(): Promise<PropertyFilterOptionsDto> {
  const response = await fetch(buildApiUrl("/api/properties/filter-options"), {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `La API respondió ${response.status} al obtener los filtros.`,
    );
  }

  return (await response.json()) as PropertyFilterOptionsDto;
}

/**
 * Envía una consulta sobre una propiedad.
 *
 * Se ejecuta en el navegador, así que la ruta es relativa y la clave de
 * Web3Forms se queda en el backend.
 *
 * Los errores del servidor traen un mensaje pensado para leerse, y es ese el
 * que se propaga: quien escribió el formulario necesita saber si debe
 * corregir un campo o reintentar más tarde.
 */
export async function submitInquiry(
  inquiry: InquiryRequestDto,
): Promise<InquiryCreatedDto> {
  const response = await fetch(buildApiUrl("/api/inquiries"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(inquiry),
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (body as ApiErrorDto | null)?.message;

    throw new Error(
      message ?? "No pudimos enviar tu consulta. Vuelve a intentarlo.",
    );
  }

  return body as InquiryCreatedDto;
}

/**
 * Lee el cuerpo de una respuesta y propaga el mensaje del servidor si falló.
 *
 * Los errores de la API traen un texto pensado para leerse; ese es el que
 * llega a la interfaz, porque explica qué corregir.
 */
async function readOrThrow<TBody>(
  response: Response,
  fallbackMessage: string,
): Promise<TBody> {
  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error((body as ApiErrorDto | null)?.message ?? fallbackMessage);
  }

  return body as TBody;
}

/**
 * Autenticación.
 *
 * Estas funciones se ejecutan en el navegador y la sesión viaja en una cookie
 * `httpOnly` que pone el servidor: no hay ningún testigo que guardar ni que
 * leer desde JavaScript (spec.md, sección 15).
 */

export async function registerAccount(
  credentials: RegisterRequestDto,
): Promise<AuthenticatedUserDto> {
  const response = await fetch(buildApiUrl("/api/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  return readOrThrow(response, "No pudimos crear tu cuenta.");
}

export async function logIn(
  credentials: LoginRequestDto,
): Promise<AuthenticatedUserDto> {
  const response = await fetch(buildApiUrl("/api/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  return readOrThrow(response, "No pudimos iniciar sesión.");
}

export async function logOut(): Promise<void> {
  const response = await fetch(buildApiUrl("/api/auth/logout"), {
    method: "POST",
  });

  await readOrThrow(response, "No pudimos cerrar la sesión.");
}

/**
 * Usuario de la sesión vigente, o `null` si no hay ninguna.
 *
 * Desde el servidor hay que reenviar la cookie a mano: `fetch` no arrastra
 * las del navegador, y sin ella la API respondería que no hay sesión.
 */
export async function fetchCurrentUser(
  cookieHeader?: string,
): Promise<AuthenticatedUserDto | null> {
  const response = await fetch(buildApiUrl("/api/auth/me"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`La API respondió ${response.status} al leer la sesión.`);
  }

  return (await response.json()) as AuthenticatedUserDto;
}

/** Guarda los cambios de la propia cuenta. */
export async function updateAccount(
  changes: UpdateAccountRequestDto,
): Promise<AuthenticatedUserDto> {
  const response = await fetch(buildApiUrl("/api/auth/me"), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(changes),
  });

  return readOrThrow(response, "No pudimos guardar los cambios.");
}

/**
 * Propiedades guardadas (spec.md, sección 16).
 *
 * La API deduce de quién son a partir de la sesión: no hay ningún parámetro
 * con el identificador de la persona, y por tanto nada que manipular para
 * ver la lista de otra.
 */
export async function fetchFavorites(
  cookieHeader?: string,
): Promise<PropertyListDto> {
  const response = await fetch(buildApiUrl("/api/favorites"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  return readOrThrow(response, "No pudimos cargar tus propiedades guardadas.");
}

/** Solo los identificadores, para saber qué tarjetas pintar marcadas. */
export async function fetchFavoriteIds(
  cookieHeader?: string,
): Promise<FavoriteIdsDto> {
  const response = await fetch(buildApiUrl("/api/favorites/ids"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  return readOrThrow(response, "No pudimos cargar tus propiedades guardadas.");
}

export async function addFavorite(propertyId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/favorites/${encodeURIComponent(propertyId)}`),
    { method: "POST" },
  );

  await readOrThrow(response, "No pudimos guardar la propiedad.");
}

export async function removeFavorite(propertyId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/favorites/${encodeURIComponent(propertyId)}`),
    { method: "DELETE" },
  );

  await readOrThrow(response, "No pudimos quitar la propiedad.");
}

/**
 * Historial de solicitudes de quien tiene la sesión.
 *
 * La página y la búsqueda las resuelve el servidor: traer el historial entero
 * para mostrar seis entradas crece con cada consulta enviada.
 */
export async function fetchUserInquiries(
  options: { readonly search?: string; readonly page?: number },
  cookieHeader?: string,
): Promise<UserInquiryPageDto> {
  const parameters = new URLSearchParams();

  if (options.search) {
    parameters.set("search", options.search);
  }

  if (options.page && options.page > 1) {
    parameters.set("page", String(options.page));
  }

  const query = parameters.toString();
  const response = await fetch(
    buildApiUrl(`/api/inquiries${query ? `?${query}` : ""}`),
    {
      cache: "no-store",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    },
  );

  return readOrThrow(response, "No pudimos cargar tus consultas.");
}

/** Quita una solicitud del historial propio. */
export async function hideInquiry(inquiryId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/inquiries/${encodeURIComponent(inquiryId)}`),
    { method: "DELETE" },
  );

  await readOrThrow(response, "No pudimos eliminar la consulta.");
}
