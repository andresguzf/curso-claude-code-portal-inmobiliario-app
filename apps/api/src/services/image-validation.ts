import { IMAGE_LIMITS } from "@portal/contracts";

/**
 * Validación del archivo que llega a la subida (spec.md, sección 24).
 *
 * Módulo puro: no importa Prisma ni `server-only`, para poder probar las
 * reglas sin base de datos ni red.
 *
 * Se comprueban tipo y tamaño antes de gastar una llamada a Cloudinary. El
 * tipo se toma del archivo, que lo declara el navegador y por tanto no es de
 * fiar; Cloudinary rechaza por su cuenta lo que no sea una imagen, así que
 * esta comprobación es la primera barrera, no la única.
 */

export type ImageValidationResult =
  | { readonly ok: true }
  | {
      readonly ok: false;
      readonly message: string;
      readonly isTooLarge: boolean;
    };

type ImageCandidate = {
  readonly type: string;
  readonly size: number;
};

/**
 * ¿El cuerpo anunciado ya excede el tope? (spec.md, sección 24b).
 *
 * `request.formData()` almacena el cuerpo entero en memoria antes de que
 * nadie pueda mirar el tamaño del archivo, así que comprobarlo después de
 * leerlo llega tarde: la memoria ya se gastó. `Content-Length` permite
 * cortar antes de leer nada.
 *
 * El margen cubre lo que el sobre `multipart` añade al archivo —las
 * fronteras y las cabeceras de cada parte—, para no rechazar por unos bytes
 * de envoltorio una imagen que sí cabe. Quien mienta en la cabecera se
 * encuentra igualmente con la comprobación de `validateImageFile`.
 */
const MULTIPART_OVERHEAD_BYTES = 8 * 1024;

export function exceedsDeclaredSize(
  contentLength: string | null,
  maxBytes: number = IMAGE_LIMITS.maxBytes,
): boolean {
  const declared = Number(contentLength);

  if (!Number.isFinite(declared) || declared <= 0) {
    // Sin cabecera o con una ilegible no se puede decidir aquí; decide la
    // comprobación posterior, que mira el archivo ya leído.
    return false;
  }

  return declared > maxBytes + MULTIPART_OVERHEAD_BYTES;
}

export function validateImageFile(file: ImageCandidate): ImageValidationResult {
  if (file.size === 0) {
    return {
      ok: false,
      message: "El archivo está vacío.",
      isTooLarge: false,
    };
  }

  if (!IMAGE_LIMITS.allowedMimeTypes.includes(file.type)) {
    return {
      ok: false,
      message: `El formato ${file.type || "desconocido"} no se admite. Usa JPG, PNG, WebP o AVIF.`,
      isTooLarge: false,
    };
  }

  if (file.size > IMAGE_LIMITS.maxBytes) {
    return {
      ok: false,
      message: `La imagen supera los ${formatMegabytes(IMAGE_LIMITS.maxBytes)} permitidos.`,
      isTooLarge: true,
    };
  }

  return { ok: true };
}

/** Sin decimales cuando el tamaño es redondo: «5 MB», no «5.0 MB». */
function formatMegabytes(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);

  return `${Number.isInteger(megabytes) ? megabytes : megabytes.toFixed(1)} MB`;
}
