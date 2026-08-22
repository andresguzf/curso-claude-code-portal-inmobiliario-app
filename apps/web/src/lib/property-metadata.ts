import type { Metadata } from "next";

import type { PropertyDetailDto } from "@portal/contracts";

import { formatFullLocation, formatPropertyPrice } from "@/lib/format";
import { SITE_NAME } from "@/lib/site";

/**
 * Metadata de la ficha de una propiedad (spec.md, sección 25).
 *
 * Módulo aparte de la página para poder probarlo sin renderizar: lo que se
 * comparte en redes se ve una vez publicado y tarde, así que conviene que
 * esté cubierto.
 */

/**
 * Largo al que se recorta la descripción.
 *
 * Google muestra alrededor de 160 caracteres y el resto lo corta él, sin
 * cuidado. Recortarlo aquí permite hacerlo por una palabra entera.
 */
const MAX_DESCRIPTION_LENGTH = 160;

/**
 * Descripción para buscadores.
 *
 * Empieza por precio y ubicación, que es lo que decide si alguien entra, y
 * completa con el texto de la ficha hasta donde quepa.
 */
export function buildPropertyDescription(property: PropertyDetailDto): string {
  const encabezado = `${formatPropertyPrice(
    property.price,
    property.currency,
    property.operationType,
  )} · ${formatFullLocation(property)}.`;

  const resumen = property.description.replace(/\s+/g, " ").trim();

  return truncateAtWord(`${encabezado} ${resumen}`, MAX_DESCRIPTION_LENGTH);
}

/**
 * Recorta sin partir una palabra por la mitad.
 *
 * Un corte a medias —«departamento lumin…»— se lee peor que una frase que
 * termina antes.
 */
export function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  const cortado = text.slice(0, maxLength - 1);
  const ultimoEspacio = cortado.lastIndexOf(" ");
  const base = ultimoEspacio > 0 ? cortado.slice(0, ultimoEspacio) : cortado;

  return `${base.replace(/[.,;:·]$/, "")}…`;
}

/**
 * Metadata completa de la ficha.
 *
 * La imagen es la portada de la propiedad. Si no tiene ninguna, no se declara
 * `images` en lugar de inventar un marcador: la tarjeta compartida se ve
 * mejor sin imagen que con una que no es de la propiedad.
 */
export function buildPropertyMetadata(property: PropertyDetailDto): Metadata {
  const description = buildPropertyDescription(property);
  const url = `/properties/${property.id}`;
  const portada = property.images.find((image) => image.isPrimary);

  return {
    title: property.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      // El título de Open Graph va completo: ahí no hay plantilla que
      // añada el nombre del sitio, y «Casa en Ñuñoa» a secas no dice dónde
      // se publicó.
      title: `${property.title} | ${SITE_NAME}`,
      description,
      url,
      locale: "es_CL",
      ...(portada
        ? { images: [{ url: portada.url, alt: property.title }] }
        : {}),
    },
    twitter: {
      card: portada ? "summary_large_image" : "summary",
      title: `${property.title} | ${SITE_NAME}`,
      description,
      ...(portada ? { images: [portada.url] } : {}),
    },
  };
}
