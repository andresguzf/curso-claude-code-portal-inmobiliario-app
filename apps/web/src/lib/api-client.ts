import {
  ADMIN_QUERY_PARAM_NAMES,
  QUERY_PARAM_NAMES,
  type AdminOverviewDto,
  type AdminPropertyDto,
  type AdminPropertyPageDto,
  type FeatureListDto,
  type PropertyInputDto,
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
  type PropertyImageDto,
  type PropertyImageOrderDto,
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

/**
 * Indicadores del panel de administración.
 *
 * Requiere rol ADMIN: la API responde 403 a cualquier otra sesión, así que
 * no basta con conocer la ruta.
 */
export async function fetchAdminOverview(
  cookieHeader?: string,
): Promise<AdminOverviewDto> {
  const response = await fetch(buildApiUrl("/api/admin/overview"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  return readOrThrow(response, "No pudimos cargar los indicadores.");
}

/**
 * Administración de propiedades (spec.md, sección 19).
 *
 * Todas exigen rol ADMIN: la API responde 403 a cualquier otra sesión. El
 * listado y la lectura se piden desde el servidor, así que hay que reenviar
 * la cookie a mano; las escrituras salen del navegador, que ya la lleva.
 */

/**
 * Copia de la URL solo los parámetros que el listado entiende.
 *
 * Se reenvían tal cual, sin interpretarlos: quien decide si un filtro es
 * válido es el backend, y un valor escrito a mano en la URL debe producir su
 * 400 en lugar de descartarse en silencio y devolver un listado que no
 * corresponde a lo pedido.
 */
export function buildAdminPropertyQueryString(
  searchParams: URLSearchParams,
): string {
  const parameters = new URLSearchParams();

  for (const name of Object.values(ADMIN_QUERY_PARAM_NAMES)) {
    for (const value of searchParams.getAll(name)) {
      if (value.trim() !== "") {
        // `append` y no `set`: tipo y operación admiten varios valores.
        parameters.append(name, value);
      }
    }
  }

  const query = parameters.toString();

  return query ? `?${query}` : "";
}

export async function fetchAdminProperties(
  searchParams: URLSearchParams,
  cookieHeader?: string,
): Promise<AdminPropertyPageDto> {
  const response = await fetch(
    buildApiUrl(
      `/api/admin/properties${buildAdminPropertyQueryString(searchParams)}`,
    ),
    {
      cache: "no-store",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    },
  );

  return readOrThrow(response, "No pudimos cargar las propiedades.");
}

/**
 * Una propiedad para editarla, o `null` si no existe.
 *
 * La distinción entre 404 y cualquier otro fallo importa: lo primero
 * significa que la propiedad no está —o se eliminó—, y la página responde
 * «no encontrada»; lo segundo no dice nada sobre ella y no debe presentarse
 * como si lo dijera.
 */
export async function fetchAdminProperty(
  propertyId: string,
  cookieHeader?: string,
): Promise<AdminPropertyDto | null> {
  const response = await fetch(
    buildApiUrl(`/api/admin/properties/${encodeURIComponent(propertyId)}`),
    {
      cache: "no-store",
      headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
    },
  );

  if (response.status === 404) {
    return null;
  }

  return readOrThrow(response, "No pudimos cargar la propiedad.");
}

/** Características disponibles, para las casillas del formulario. */
export async function fetchAdminFeatures(
  cookieHeader?: string,
): Promise<FeatureListDto> {
  const response = await fetch(buildApiUrl("/api/admin/features"), {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : undefined,
  });

  return readOrThrow(response, "No pudimos cargar las características.");
}

export async function createAdminProperty(
  property: PropertyInputDto,
): Promise<AdminPropertyDto> {
  const response = await fetch(buildApiUrl("/api/admin/properties"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(property),
  });

  return readOrThrow(response, "No pudimos crear la propiedad.");
}

/** `PUT` reemplaza la propiedad entera: el cuerpo es la versión definitiva. */
export async function updateAdminProperty(
  propertyId: string,
  property: PropertyInputDto,
): Promise<AdminPropertyDto> {
  const response = await fetch(
    buildApiUrl(`/api/admin/properties/${encodeURIComponent(propertyId)}`),
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(property),
    },
  );

  return readOrThrow(response, "No pudimos guardar la propiedad.");
}

/**
 * Elimina una propiedad.
 *
 * El borrado es lógico: la propiedad desaparece del portal y del panel, pero
 * sus consultas y los favoritos ajenos se conservan (spec.md, sección 19).
 */
export async function deleteAdminProperty(propertyId: string): Promise<void> {
  const response = await fetch(
    buildApiUrl(`/api/admin/properties/${encodeURIComponent(propertyId)}`),
    { method: "DELETE" },
  );

  await readOrThrow(response, "No pudimos eliminar la propiedad.");
}

/**
 * Imágenes de una propiedad (spec.md, sección 20).
 *
 * Todas se ejecutan en el navegador y actúan de inmediato: no esperan al
 * envío del formulario de la propiedad, porque operan sobre un archivo que
 * ya existe.
 */

function buildImagesPath(propertyId: string): string {
  return `/api/admin/properties/${encodeURIComponent(propertyId)}/images`;
}

/**
 * Sube una imagen.
 *
 * El cuerpo es `FormData` y **no** lleva `Content-Type`: el navegador lo
 * pone con el separador que él mismo genera, y escribirlo a mano produce un
 * cuerpo que el servidor no sabe partir.
 */
export async function uploadPropertyImage(
  propertyId: string,
  file: File,
): Promise<PropertyImageDto> {
  const body = new FormData();

  body.append("file", file);

  const response = await fetch(buildApiUrl(buildImagesPath(propertyId)), {
    method: "POST",
    body,
  });

  return readOrThrow(response, "No pudimos subir la imagen.");
}

/** Fija el orden. Se envía la lista completa, no un movimiento. */
export async function reorderPropertyImages(
  propertyId: string,
  imageIds: readonly string[],
): Promise<void> {
  const body: PropertyImageOrderDto = { imageIds };
  const response = await fetch(buildApiUrl(buildImagesPath(propertyId)), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  await readOrThrow(response, "No pudimos guardar el orden.");
}

export async function makePropertyImagePrimary(
  propertyId: string,
  imageId: string,
): Promise<void> {
  const response = await fetch(
    buildApiUrl(
      `${buildImagesPath(propertyId)}/${encodeURIComponent(imageId)}`,
    ),
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPrimary: true }),
    },
  );

  await readOrThrow(response, "No pudimos cambiar la imagen principal.");
}

export async function deletePropertyImage(
  propertyId: string,
  imageId: string,
): Promise<void> {
  const response = await fetch(
    buildApiUrl(
      `${buildImagesPath(propertyId)}/${encodeURIComponent(imageId)}`,
    ),
    { method: "DELETE" },
  );

  await readOrThrow(response, "No pudimos eliminar la imagen.");
}
