import type { ImageLoaderProps } from "next/image";

/**
 * Entrega de imágenes desde Cloudinary (plan.md, sección 11).
 *
 * Sin esto, el optimizador de Next descarga el original —hasta cinco
 * megabytes— y lo redimensiona en nuestro servidor. Con esto lo redimensiona
 * Cloudinary, que ya tiene el archivo y una red de distribución delante.
 *
 * Solo se aplica a las URL de Cloudinary. Las demás —las de marcador del
 * seed y la fotografía del hero— siguen pasando por el optimizador de Next,
 * porque para ellas no hay ninguna transformación que pedir.
 */

/** Cloudinary intercala las transformaciones justo después de `/upload/`. */
const UPLOAD_SEGMENT = "/image/upload/";

export function isCloudinaryUrl(source: string): boolean {
  return (
    source.startsWith("https://res.cloudinary.com/") &&
    source.includes(UPLOAD_SEGMENT)
  );
}

/**
 * Construye la URL de entrega con las transformaciones pedidas.
 *
 * - `f_auto` elige el formato: AVIF o WebP a quien los admita, JPG al resto.
 * - `q_auto` ajusta la compresión según el contenido de la imagen.
 * - `c_limit` **reduce** pero nunca amplía: una foto subida a 800px no se
 *   estira a 1200 y se ve borrosa; se sirve tal cual.
 *
 * `quality` explícita gana a `q_auto` cuando quien llama la fija, porque
 * entonces está pidiendo un valor concreto a propósito.
 */
export function buildCloudinaryUrl({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) {
    return src;
  }

  const transformaciones = [
    "f_auto",
    quality === undefined ? "q_auto" : `q_${quality}`,
    "c_limit",
    `w_${width}`,
  ].join(",");

  return src.replace(UPLOAD_SEGMENT, `${UPLOAD_SEGMENT}${transformaciones}/`);
}

/**
 * Cargador para `next/image`.
 *
 * Devolver la fuente sin tocar en el resto de los casos sería un error: con
 * un cargador propio, Next deja de optimizar y sirve lo que se le devuelva.
 * Por eso quien lo usa comprueba antes que la URL sea de Cloudinary, y si no
 * lo es no pasa cargador alguno.
 */
export const cloudinaryLoader = buildCloudinaryUrl;
