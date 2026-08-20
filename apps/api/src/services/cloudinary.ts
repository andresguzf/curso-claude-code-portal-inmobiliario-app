import { createHash } from "node:crypto";

/**
 * Subida de imágenes a Cloudinary (plan.md, sección 11).
 *
 * El archivo viaja del navegador a esta API y de aquí a Cloudinary. No se
 * sube desde el navegador porque la firma exige el secreto de la cuenta, y
 * ese secreto no sale del servidor (spec.md, sección 24).
 *
 * Se habla con la API REST directamente, sin el SDK: la operación son dos
 * llamadas y una firma SHA-1, y el SDK arrastraría una dependencia entera
 * para eso. Es el mismo criterio que con Geocoding y Web3Forms.
 *
 * Las funciones puras —firma, URL y lectura de la respuesta— viven separadas
 * de las que hacen red, para poder probarlas sin salir a internet.
 */

/**
 * Carpeta de Cloudinary donde aterrizan las imágenes del portal.
 *
 * Tenerlas agrupadas permite revisarlas, aplicarles una transformación o
 * borrarlas en bloque sin tocar el resto de la cuenta.
 */
export const CLOUDINARY_FOLDER = "propiedades-claude";

const CLOUDINARY_API = "https://api.cloudinary.com/v1_1";

/** Cloudinary no debe dejar colgada la petición si tarda en responder. */
const UPLOAD_TIMEOUT_MS = 30_000;

export type CloudinaryConfig = {
  readonly cloudName: string;
  readonly apiKey: string;
  readonly apiSecret: string;
};

export type UploadedImage = {
  readonly url: string;
  readonly publicId: string;
};

/**
 * Entorno del que se leen `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` y
 * `CLOUDINARY_API_SECRET`.
 *
 * Es un parámetro y no una lectura directa de `process.env` para poder
 * probar la función con un objeto, sin tocar el entorno del proceso.
 */
type CloudinaryEnvironment = Readonly<Record<string, string | undefined>>;

/**
 * Credenciales de la cuenta, o `null` si el entorno no las tiene.
 *
 * Devolver `null` en lugar de lanzar permite responder «esta función no está
 * configurada» con un 503, que es distinto de «Cloudinary falló».
 */
export function readCloudinaryConfig(
  environment: CloudinaryEnvironment = process.env,
): CloudinaryConfig | null {
  const cloudName = environment.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = environment.CLOUDINARY_API_KEY?.trim();
  const apiSecret = environment.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  return { cloudName, apiKey, apiSecret };
}

/**
 * Firma de una subida.
 *
 * Cloudinary espera el SHA-1 de los parámetros ordenados alfabéticamente,
 * unidos como `clave=valor&clave=valor`, con el secreto pegado al final. El
 * orden no es un detalle: firmar en otro orden produce una firma que
 * Cloudinary rechaza.
 */
export function buildUploadSignature(
  parameters: Record<string, string>,
  apiSecret: string,
): string {
  const canonical = Object.keys(parameters)
    .sort()
    .map((key) => `${key}=${parameters[key]}`)
    .join("&");

  return createHash("sha1").update(`${canonical}${apiSecret}`).digest("hex");
}

export function buildUploadUrl(cloudName: string): string {
  return `${CLOUDINARY_API}/${encodeURIComponent(cloudName)}/image/upload`;
}

export function buildDestroyUrl(cloudName: string): string {
  return `${CLOUDINARY_API}/${encodeURIComponent(cloudName)}/image/destroy`;
}

/**
 * Extrae de la respuesta lo único que PostgreSQL guarda: la URL y el
 * identificador del recurso (spec.md, sección 5).
 *
 * Se prefiere `secure_url` a `url`: la del portal es una página `https`, y
 * una imagen servida por `http` la marcaría como contenido mixto.
 */
export function readUploadedImage(payload: unknown): UploadedImage | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const { secure_url: secureUrl, public_id: publicId } = payload as {
    secure_url?: unknown;
    public_id?: unknown;
  };

  if (typeof secureUrl !== "string" || typeof publicId !== "string") {
    return null;
  }

  if (secureUrl === "" || publicId === "") {
    return null;
  }

  return { url: secureUrl, publicId };
}

/**
 * Sube un archivo y devuelve su URL y su identificador.
 *
 * Devuelve `null` si Cloudinary rechaza la subida o responde algo que no se
 * puede interpretar: quien llama lo traduce en un 502, porque el fallo es de
 * un servicio externo y no de quien envió la imagen.
 */
export async function uploadImage(
  file: File,
  config: CloudinaryConfig,
): Promise<UploadedImage | null> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParameters = {
    folder: CLOUDINARY_FOLDER,
    timestamp,
  };

  const form = new FormData();

  form.append("file", file);
  form.append("api_key", config.apiKey);
  form.append("folder", signedParameters.folder);
  form.append("timestamp", timestamp);
  form.append(
    "signature",
    buildUploadSignature(signedParameters, config.apiSecret),
  );

  try {
    const response = await fetch(buildUploadUrl(config.cloudName), {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });

    if (!response.ok) {
      console.error(
        `[cloudinary] La subida respondió ${response.status}`,
        await response.text().catch(() => ""),
      );

      return null;
    }

    return readUploadedImage(await response.json());
  } catch (error) {
    console.error("[cloudinary] No fue posible subir la imagen", error);

    return null;
  }
}

/**
 * Elimina un recurso de Cloudinary.
 *
 * Se usa para deshacer una subida cuya fila no llegó a guardarse: sin esto,
 * el archivo quedaría en la cuenta sin que nada lo referencie y sin forma de
 * saber que sobra.
 *
 * No lanza: quien la llama ya está atendiendo otro fallo, y un error al
 * limpiar no debe tapar el original.
 */
export async function destroyImage(
  publicId: string,
  config: CloudinaryConfig,
): Promise<boolean> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedParameters = { public_id: publicId, timestamp };

  const form = new FormData();

  form.append("public_id", publicId);
  form.append("api_key", config.apiKey);
  form.append("timestamp", timestamp);
  form.append(
    "signature",
    buildUploadSignature(signedParameters, config.apiSecret),
  );

  try {
    const response = await fetch(buildDestroyUrl(config.cloudName), {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    });

    return response.ok;
  } catch (error) {
    console.error(
      `[cloudinary] No fue posible eliminar el recurso ${publicId}`,
      error,
    );

    return false;
  }
}
