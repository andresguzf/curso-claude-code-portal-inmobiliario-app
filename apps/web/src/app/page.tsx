import { CallToActionSection } from "@/components/home/call-to-action-section";
import { HeroSection } from "@/components/home/hero-section";
import { PropertyShowcase } from "@/components/home/property-showcase";
import { fetchPublicProperties } from "@/lib/api-client";
import type { PropertySummaryDto } from "@portal/contracts";

/** La portada muestra el catálogo vigente en cada visita. */
export const dynamic = "force-dynamic";

const PROPERTIES_PER_SECTION = 3;

export default async function HomePage() {
  const properties = await loadProperties();

  const featured = properties
    .filter((property) => property.isFeatured)
    .slice(0, PROPERTIES_PER_SECTION);
  const forSale = properties
    .filter((property) => property.operationType === "SALE")
    .slice(0, PROPERTIES_PER_SECTION);
  const forRent = properties
    .filter((property) => property.operationType === "RENT")
    .slice(0, PROPERTIES_PER_SECTION);

  return (
    <>
      <HeroSection />

      <PropertyShowcase
        id="titulo-destacadas"
        title="Propiedades destacadas"
        description="Nuestra selección de propiedades recomendadas."
        properties={featured}
        linkHref="/properties"
        linkLabel="Ver todo el catálogo"
        prioritizeImages
      />

      <PropertyShowcase
        id="titulo-venta"
        title="Propiedades en venta"
        description="Casas, departamentos, terrenos y oficinas disponibles para comprar."
        properties={forSale}
        linkHref="/properties?operation=SALE"
        linkLabel="Ver todas en venta"
      />

      <PropertyShowcase
        id="titulo-arriendo"
        title="Propiedades en arriendo"
        description="Alternativas de arriendo en distintas comunas."
        properties={forRent}
        linkHref="/properties?operation=RENT"
        linkLabel="Ver todas en arriendo"
      />

      {properties.length === 0 ? <EmptyCatalogNotice /> : null}

      <CallToActionSection />
    </>
  );
}

/**
 * Obtiene el catálogo publicado.
 *
 * Si la API falla, la portada se degrada a sus secciones estáticas en lugar
 * de romperse por completo.
 */
async function loadProperties(): Promise<readonly PropertySummaryDto[]> {
  try {
    const { data } = await fetchPublicProperties();
    return data;
  } catch (error) {
    console.error("[home] No fue posible cargar las propiedades", error);
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
