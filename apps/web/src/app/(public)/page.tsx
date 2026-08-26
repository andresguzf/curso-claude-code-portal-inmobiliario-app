import { CallToActionSection } from "@/components/home/call-to-action-section";
import { HeroSection } from "@/components/home/hero-section";
import { PropertyShowcase } from "@/components/home/property-showcase";
import { fetchPublicProperties } from "@/lib/api-client";
import { getFavoritePropertyIds } from "@/lib/favorites";
import type { PropertyListQuery, PropertySummaryDto } from "@portal/contracts";

/** La portada muestra el catálogo vigente en cada visita. */
export const dynamic = "force-dynamic";

const PROPERTIES_PER_SECTION = 3;

export default async function HomePage() {
  // Cada sección pide lo suyo, y el filtro lo resuelve PostgreSQL.
  //
  // Antes se traía el catálogo y se filtraba en memoria. Dejó de funcionar en
  // cuanto el catálogo pasó a paginar: de las tres destacadas, solo la que
  // caía en la primera página llegaba a la portada.
  const [featured, forSale, forRent, favoritePropertyIds] = await Promise.all([
    loadSection({ featured: true }),
    loadSection({ operations: ["SALE"] }),
    loadSection({ operations: ["RENT"] }),
    getFavoritePropertyIds(),
  ]);

  const properties = [...featured, ...forSale, ...forRent];

  return (
    <>
      <HeroSection />

      <PropertyShowcase
        id="titulo-destacadas"
        title="Propiedades destacadas"
        description="Nuestra selección de propiedades recomendadas."
        properties={featured}
        favoritePropertyIds={favoritePropertyIds}
        linkHref="/properties"
        linkLabel="Ver todo el catálogo"
        prioritizeImages
      />

      <PropertyShowcase
        id="titulo-venta"
        title="Propiedades en venta"
        description="Casas, departamentos, terrenos y oficinas disponibles para comprar."
        properties={forSale}
        favoritePropertyIds={favoritePropertyIds}
        linkHref="/properties?operation=SALE"
        linkLabel="Ver todas en venta"
      />

      <PropertyShowcase
        id="titulo-arriendo"
        title="Propiedades en arriendo"
        description="Alternativas de arriendo en distintas comunas."
        properties={forRent}
        favoritePropertyIds={favoritePropertyIds}
        linkHref="/properties?operation=RENT"
        linkLabel="Ver todas en arriendo"
      />

      {properties.length === 0 ? <EmptyCatalogNotice /> : null}

      <CallToActionSection />
    </>
  );
}

/**
 * Una sección de la portada.
 *
 * Si la API falla, esa sección queda vacía y la portada se degrada en lugar de
 * romperse por completo. Un fallo tampoco arrastra a las demás secciones,
 * porque cada una pide por su cuenta.
 */
async function loadSection(
  query: PropertyListQuery,
): Promise<readonly PropertySummaryDto[]> {
  try {
    const { data } = await fetchPublicProperties(query);

    return data.slice(0, PROPERTIES_PER_SECTION);
  } catch (error) {
    console.error("[home] No fue posible cargar una sección", error);

    return [];
  }
}

function EmptyCatalogNotice() {
  return (
    <section className="border-b border-line">
      <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <p className="text-sm text-ink-muted">
          Por ahora no hay propiedades publicadas. Vuelve a intentarlo en unos
          minutos.
        </p>
      </div>
    </section>
  );
}
