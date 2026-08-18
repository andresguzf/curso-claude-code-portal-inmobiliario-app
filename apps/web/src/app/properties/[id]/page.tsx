import Link from "next/link";
import { notFound } from "next/navigation";

import type { PropertyDetailDto } from "@portal/contracts";

import { CatalogStatus } from "@/components/property/catalog-status";
import { PropertyContactForm } from "@/components/property/property-contact-form";
import { PropertyFeatures } from "@/components/property/property-features";
import { PropertyGallery } from "@/components/property/property-gallery";
import { PropertyLocation } from "@/components/property/property-location";
import { PropertySpecifications } from "@/components/property/property-specifications";
import { fetchPublicPropertyById } from "@/lib/api-client";
import {
  formatFullLocation,
  formatOperationType,
  formatPropertyPrice,
  formatPropertyType,
} from "@/lib/format";

/** El detalle refleja el estado de publicación vigente en cada visita. */
export const dynamic = "force-dynamic";

/**
 * Detalle de una propiedad (spec.md, sección 12).
 *
 * Consume exclusivamente la API REST: no toca PostgreSQL ni la capa de
 * servicios del backend (plan.md, sección 1). El backend decide qué es
 * visible, y una propiedad despublicada responde 404 igual que una
 * inexistente.
 *
 * La metadata dinámica llega en el paso 31.
 */
export default async function PropertyDetailPage({
  params,
}: PageProps<"/properties/[id]">) {
  const { id } = await params;
  const result = await loadProperty(id);

  if (result.status === "error") {
    return (
      <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <CatalogStatus
          isError
          title="No pudimos cargar la propiedad"
          description="Hubo un problema al consultar esta propiedad. Vuelve a intentarlo en unos minutos."
          action={{ href: `/properties/${id}`, label: "Reintentar" }}
        />
      </div>
    );
  }

  // Una propiedad inexistente o despublicada llega aquí como 404.
  if (result.property === null) {
    notFound();
  }

  return <PropertyDetail property={result.property} />;
}

function PropertyDetail({
  property,
}: {
  readonly property: PropertyDetailDto;
}) {
  return (
    <article className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <nav aria-label="Miga de pan" className="text-sm">
        <Link
          href="/properties"
          className="rounded-sm text-ink-muted underline underline-offset-4 transition-colors hover:text-accent"
        >
          ← Volver al catálogo
        </Link>
      </nav>

      <header className="mt-6">
        <p className="text-xs font-medium tracking-wide uppercase text-ink-muted">
          {formatOperationType(property.operationType)} ·{" "}
          {formatPropertyType(property.propertyType)}
          {property.isFeatured ? " · Destacada" : ""}
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          {property.title}
        </h1>

        <p className="mt-3 text-2xl font-bold text-accent sm:text-3xl">
          {formatPropertyPrice(
            property.price,
            property.currency,
            property.operationType,
          )}
        </p>

        <p className="mt-2 text-base text-ink-muted">
          {formatFullLocation(property)}
        </p>
      </header>

      <PropertyGallery
        images={property.images}
        propertyTitle={property.title}
      />

      <div className="mt-10 flex flex-col gap-10">
        <section aria-labelledby="titulo-descripcion">
          <h2
            id="titulo-descripcion"
            className="text-xl font-semibold tracking-tight"
          >
            Descripción
          </h2>
          <p className="mt-4 text-base whitespace-pre-line text-ink">
            {property.description}
          </p>
        </section>

        <PropertySpecifications property={property} />

        <PropertyFeatures features={property.features} />

        <PropertyLocation
          location={property}
          coordinates={property.coordinates}
        />

        <PropertyContactForm
          propertyId={property.id}
          propertyTitle={property.title}
        />
      </div>
    </article>
  );
}

type PropertyLoadResult =
  | { readonly status: "ready"; readonly property: PropertyDetailDto | null }
  | { readonly status: "error" };

/**
 * Distingue «no existe» de «no se pudo consultar».
 *
 * Sin esa distinción un backend caído mostraría un 404, sugiriendo que la
 * propiedad fue eliminada cuando en realidad sigue publicada.
 */
async function loadProperty(id: string): Promise<PropertyLoadResult> {
  try {
    return { status: "ready", property: await fetchPublicPropertyById(id) };
  } catch (error) {
    console.error(`[property ${id}] No fue posible cargar la propiedad`, error);

    return { status: "error" };
  }
}
