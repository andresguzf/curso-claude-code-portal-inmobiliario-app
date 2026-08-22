"use client";

import Image, { type ImageProps } from "next/image";

import { cloudinaryLoader, isCloudinaryUrl } from "@/lib/cloudinary-image";

/**
 * Imagen remota, servida por quien mejor pueda hacerlo.
 *
 * Si viene de Cloudinary, se le pide a Cloudinary ya redimensionada y en el
 * formato que admita el navegador: tiene el archivo y una red de
 * distribución delante, y así el optimizador de Next no descarga el original
 * para reescalarlo aquí.
 *
 * Cualquier otra imagen sigue pasando por el optimizador de Next. La
 * distinción es necesaria: al fijar un cargador propio, Next deja de
 * optimizar y sirve tal cual lo que se le devuelva.
 *
 * Es un componente de **cliente** por obligación: el cargador es una
 * función, y una función no se puede enviar de un componente de servidor a
 * uno de cliente. Declarándolo aquí, la función se crea ya en el cliente y
 * nunca cruza esa frontera.
 */
export function RemoteImage({ src, alt, ...props }: ImageProps) {
  const esDeCloudinary = typeof src === "string" && isCloudinaryUrl(src);

  // `alt` se declara aparte y no llega por el `spread`: así lo ve el
  // analizador de accesibilidad, que si no da por hecho que falta.
  return (
    <Image
      src={src}
      alt={alt}
      {...(esDeCloudinary ? { loader: cloudinaryLoader } : {})}
      {...props}
    />
  );
}
