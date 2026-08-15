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
  INTERNAL_SERVER_ERROR: 500,
} as const;

export function jsonOk<TBody>(
  body: TBody,
  status: number = HTTP_STATUS.OK,
): NextResponse<TBody> {
  return NextResponse.json(body, { status });
}

export function jsonError(
  message: string,
  status: number,
): NextResponse<ApiErrorBody> {
  return NextResponse.json({ message, status }, { status });
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
