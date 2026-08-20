import { cookies } from "next/headers";
import { notFound } from "next/navigation";

import type { PropertyFeatureDto } from "@portal/contracts";

import { PropertyForm } from "@/components/admin/property-form";
import { fetchAdminFeatures, fetchAdminProperty } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";

/** Se edita lo que hay guardado ahora, no una versión en caché. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Editar propiedad",
};

/**
 * Edición de una propiedad (spec.md, sección 19).
 *
 * Guardar reemplaza la propiedad entera, características incluidas: el
 * formulario manda la lista definitiva, no una lista de añadidos.
 *
 * Una propiedad eliminada responde «no existe», igual que en la API: el
 * borrado es lógico, pero para la administración es un borrado.
 */
export default async function EditPropertyPage({
  params,
}: {
  readonly params: Promise<{ readonly propertyId: string }>;
}) {
  const { propertyId } = await params;

  await requireAdminUser(`/admin/properties/${propertyId}/edit`);

  const cookieHeader = (await cookies()).toString();
  const property = await fetchAdminProperty(propertyId, cookieHeader);

  if (!property) {
    notFound();
  }

  const features = await loadFeatures(cookieHeader);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        Editar propiedad
      </h1>
      <p className="mt-2 text-sm text-ink-muted">
        {property.isPublished
          ? "Está publicada: los cambios se ven en el portal al guardar."
          : "Está en borrador: no aparece en el portal hasta que la publiques."}
      </p>

      <div className="mt-6 rounded-xl border border-line bg-card p-6">
        <PropertyForm features={features} property={property} />
      </div>
    </div>
  );
}

/**
 * Características disponibles.
 *
 * Si no se pueden cargar se muestran ninguna, y el formulario avisa. Es
 * preferible a impedir cualquier otra corrección sobre la propiedad.
 */
async function loadFeatures(
  cookieHeader: string,
): Promise<readonly PropertyFeatureDto[]> {
  try {
    return (await fetchAdminFeatures(cookieHeader)).data;
  } catch (error) {
    console.error("[admin] No fue posible cargar las características", error);

    return [];
  }
}
