import Image from "next/image";
import Link from "next/link";

import type { PropertySummaryDto } from "@portal/contracts";

import {
  formatArea,
  formatOperationType,
  formatPropertyPrice,
  formatPropertyType,
  formatShortLocation,
} from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Tarjeta reutilizable de propiedad (spec.md, sección 8).
 *
 * Se usa tanto en la portada como en el catálogo, así que no asume nada
 * sobre su contenedor: ocupa el alto disponible y recibe el `sizes` de la
 * imagen desde quien la coloca en una cuadrícula.
 *
 * Va sobre fondo claro con una sombra suave, para que se despegue del cuerpo
 * arena de la página.
 */

/** Corresponde a la cuadrícula por omisión de `PropertyGrid`. */
export const DEFAULT_CARD_IMAGE_SIZES =
  "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

type PropertyCardProps = {
  readonly property: PropertySummaryDto;
  /** Descriptor `sizes` de la imagen, según las columnas del contenedor. */
  readonly imageSizes?: string;
  /** Carga la imagen con prioridad. Solo para tarjetas visibles al entrar. */
  readonly priority?: boolean;
  readonly className?: string;
};

export function PropertyCard({
  property,
  imageSizes = DEFAULT_CARD_IMAGE_SIZES,
  priority = false,
  className,
}: PropertyCardProps) {
  const usableArea = formatArea(property.usableAreaSquareMeters);

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="relative aspect-[4/3] bg-muted">
        {property.primaryImage ? (
          <Image
            src={property.primaryImage.url}
            alt={`Fotografía de ${property.title}`}
            fill
            sizes={imageSizes}
            priority={priority}
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm text-ink-muted">
            Sin fotografía
          </span>
        )}

        {property.isFeatured ? (
          <span className="absolute top-3 left-3 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
            Destacada
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
          {formatOperationType(property.operationType)} ·{" "}
          {formatPropertyType(property.propertyType)}
        </p>

        <h3 className="text-base font-semibold text-ink">
          {/*
            El seudoelemento extiende el enlace sobre toda la tarjeta: el área
            pulsable abarca la imagen completa sin anidar enlaces ni repetir
            el destino para lectores de pantalla.
          */}
          <Link
            href={`/properties/${property.id}`}
            className="rounded-sm after:absolute after:inset-0"
          >
            {property.title}
          </Link>
        </h3>

        <p className="text-lg font-bold text-accent tabular-nums">
          {formatPropertyPrice(
            property.price,
            property.currency,
            property.operationType,
          )}
        </p>

        <p className="text-sm text-ink-muted">
          {formatShortLocation(property.commune, property.city)}
        </p>

        <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-3 text-sm text-ink-muted tabular-nums">
          {property.bedrooms !== null ? (
            <div className="flex gap-1">
              <dt>Dormitorios:</dt>
              <dd className="font-medium text-ink">{property.bedrooms}</dd>
            </div>
          ) : null}
          {property.bathrooms !== null ? (
            <div className="flex gap-1">
              <dt>Baños:</dt>
              <dd className="font-medium text-ink">{property.bathrooms}</dd>
            </div>
          ) : null}
          {usableArea ? (
            <div className="flex gap-1">
              <dt>Útil:</dt>
              <dd className="font-medium text-ink">{usableArea}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
