import { NextResponse } from "next/server";

/**
 * Formato uniforme de respuestas REST (plan.md, sección 14).
 *
 * Los errores nunca exponen detalles internos: el mensaje es para la persona
 * usuaria y la causa técnica queda en los logs del servidor.
 */

export type ApiErrorBody = {
  readonly message: string;
  readonly status: number;
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  /** El cuerpo excede lo que el endpoint acepta (una imagen demasiado grande). */
  PAYLOAD_TOO_LARGE: 413,
  /** Se agotaron los intentos permitidos en la ventana actual. */
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  /** Un servicio externo respondió mal (Google Maps, Cloudinary, Web3Forms). */
  BAD_GATEWAY: 502,
  /** Una integración externa no está configurada en este entorno. */
  SERVICE_UNAVAILABLE: 503,
} as const;

/**
 * Ninguna respuesta de la API se guarda en una caché (spec.md, sección 24b).
 *
 * Casi todas dependen de quién pregunta: la sesión, los favoritos, el listado
 * de usuarios. Una respuesta privada sin instrucción de caché puede quedar
 * almacenada en un proxy intermedio y servirse después a otra persona, porque
 * nada le dice a ese proxy que la respuesta no es de todos.
 *
 * Se decide aquí y no en cada endpoint por el mismo motivo que `deletedAt`
 * vive en un solo sitio: lo que hay que repetir en cada archivo nuevo es lo
 * que se olvida. Hoy además no se pierde nada, porque todos declaran
 * `force-dynamic` y ninguno era cacheable.
 */
const NO_STORE = { "Cache-Control": "no-store" } as const;

export function jsonOk<TBody>(
  body: TBody,
  status: number = HTTP_STATUS.OK,
): NextResponse<TBody> {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export function jsonError(
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ message, status }, { status, headers: NO_STORE });
}

/**
 * Rechaza por exceso de intentos (spec.md, sección 24b).
 *
 * `Retry-After` dice en cuántos segundos vuelve a admitirse un intento. Sin
 * esa cabecera, un cliente automático solo puede reintentar a ciegas, y quien
 * usa el portal no sabría si esperar un minuto o una hora.
 */
export function jsonTooManyRequests(
  retryAfterSeconds: number,
): NextResponse<ApiErrorBody> {
  const status = HTTP_STATUS.TOO_MANY_REQUESTS;

  return NextResponse.json(
    {
      message: `Demasiados intentos. Vuelve a probar en ${formatWait(retryAfterSeconds)}.`,
      status,
    },
    {
      status,
      headers: {
        ...NO_STORE,
        "Retry-After": String(retryAfterSeconds),
      },
    },
  );
}

/** «2 minutos» se lee mejor que «120 segundos». */
function formatWait(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} segundo${seconds === 1 ? "" : "s"}`;
  }

  const minutes = Math.ceil(seconds / 60);

  return `${minutes} minuto${minutes === 1 ? "" : "s"}`;
}

/**
 * Traduce un fallo inesperado en un 500 sin filtrar la traza.
 *
 * `context` identifica el endpoint en el log del servidor.
 */
export function jsonInternalError(
  context: string,
  error: unknown,
): NextResponse<ApiErrorBody> {
  console.error(`[api] ${context}`, error);

  return jsonError(
    "Ocurrió un error al procesar la solicitud.",
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
  );
}
