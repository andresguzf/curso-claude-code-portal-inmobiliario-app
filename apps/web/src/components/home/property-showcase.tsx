import Image from "next/image";
import Link from "next/link";

import {
  formatArea,
  formatOperationType,
  formatPropertyPrice,
  formatPropertyType,
  formatShortLocation,
} from "@/lib/format";
import type { PropertySummaryDto } from "@portal/contracts";

/**
 * Sección de propiedades de la portada (spec.md, sección 7).
 *
 * Nota: la tarjeta de más abajo es provisional. El Paso 8 la reemplaza por un
 * componente reutilizable compartido con el catálogo.
 */

type PropertyShowcaseProps = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly properties: readonly PropertySummaryDto[];
  readonly linkHref: string;
  readonly linkLabel: string;
};

export function PropertyShowcase({
  id,
  title,
  description,
  properties,
  linkHref,
  linkLabel,
}: PropertyShowcaseProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby={id}
      className="border-b border-black/10 dark:border-white/15"
    >
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id={id} className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-sm opacity-75">{description}</p>
          </div>

          <Link
            href={linkHref}
            className="rounded-md text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {linkLabel}
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <li key={property.id}>
              <PropertyPreviewCard property={property} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PropertyPreviewCard({
  property,
}: {
  readonly property: PropertySummaryDto;
}) {
  const usableArea = formatArea(property.usableAreaSquareMeters);

  return (
    <article className="group relative h-full overflow-hidden rounded-xl border border-black/10 transition-shadow hover:shadow-md dark:border-white/15">
      <div className="relative aspect-[4/3] bg-black/5 dark:bg-white/10">
        {property.primaryImage ? (
          <Image
            src={property.primaryImage.url}
            alt={`Fotografía de ${property.title}`}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <span className="flex h-full items-center justify-center text-sm opacity-60">
            Sin fotografía
          </span>
        )}

        {property.isFeatured ? (
          <span className="absolute top-3 left-3 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background">
            Destacada
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-4">
        <p className="text-xs font-medium tracking-wide uppercase opacity-60">
          {formatOperationType(property.operationType)} ·{" "}
          {formatPropertyType(property.propertyType)}
        </p>

        <h3 className="text-base font-semibold">
          <Link
            href={`/properties/${property.id}`}
            className="rounded-sm after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
          >
            {property.title}
          </Link>
        </h3>

        <p className="text-lg font-semibold">
          {formatPropertyPrice(
            property.price,
            property.currency,
            property.operationType,
          )}
        </p>

        <p className="text-sm opacity-75">
          {formatShortLocation(property.commune, property.city)}
        </p>

        <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm opacity-75">
          {property.bedrooms !== null ? (
            <div className="flex gap-1">
              <dt>Dormitorios:</dt>
              <dd>{property.bedrooms}</dd>
            </div>
          ) : null}
          {property.bathrooms !== null ? (
            <div className="flex gap-1">
              <dt>Baños:</dt>
              <dd>{property.bathrooms}</dd>
            </div>
          ) : null}
          {usableArea ? (
            <div className="flex gap-1">
              <dt>Útil:</dt>
              <dd>{usableArea}</dd>
            </div>
          ) : null}
        </dl>
      </div>
    </article>
  );
}
