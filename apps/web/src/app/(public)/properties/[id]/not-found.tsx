import { CatalogStatus } from "@/components/property/catalog-status";

/**
 * Propiedad inexistente o despublicada.
 *
 * El mensaje no distingue ambos casos, igual que la API: revelar que una
 * propiedad existe pero está despublicada filtraría información del panel de
 * administración.
 */
export default function PropertyNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <CatalogStatus
        title="No encontramos esta propiedad"
        description="La propiedad que buscas no está disponible. Puede que se haya retirado del portal o que el enlace sea incorrecto."
        action={{ href: "/properties", label: "Ver todas las propiedades" }}
      />
    </div>
  );
}
