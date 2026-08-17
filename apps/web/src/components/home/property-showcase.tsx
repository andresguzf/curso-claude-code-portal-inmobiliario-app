import Link from "next/link";

import type { PropertySummaryDto } from "@portal/contracts";

import { PropertyGrid } from "@/components/property/property-grid";

/** Sección de propiedades de la portada (spec.md, sección 7). */

type PropertyShowcaseProps = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly properties: readonly PropertySummaryDto[];
  readonly linkHref: string;
  readonly linkLabel: string;
  /** Prioriza las imágenes cuando la sección es la primera de la página. */
  readonly prioritizeImages?: boolean;
};

export function PropertyShowcase({
  id,
  title,
  description,
  properties,
  linkHref,
  linkLabel,
  prioritizeImages = false,
}: PropertyShowcaseProps) {
  if (properties.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby={id} className="border-b border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id={id} className="text-2xl font-semibold tracking-tight">
              {title}
            </h2>
            <p className="mt-1.5 text-sm text-ink-muted">{description}</p>
          </div>

          <Link
            href={linkHref}
            className="rounded-md text-sm font-medium underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {linkLabel}
          </Link>
        </div>

        <PropertyGrid
          properties={properties}
          prioritizeFirstImages={prioritizeImages}
          className="mt-8"
        />
      </div>
    </section>
  );
}
