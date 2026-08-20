import { cookies } from "next/headers";

import { PropertyForm } from "@/components/admin/property-form";
import { fetchAdminFeatures } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";

/** Las características disponibles cambian con el catálogo. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Nueva propiedad",
};

const NEW_PROPERTY_PATH = "/admin/properties/new";

/**
 * Alta de una propiedad (spec.md, sección 19).
 *
 * Nace despublicada salvo que se marque lo contrario: es preferible que algo
 * a medio escribir no aparezca en el portal a que aparezca por omisión.
 */
export default async function NewPropertyPage() {
  await requireAdminUser(NEW_PROPERTY_PATH);

  const features = await loadFeatures();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Nueva propiedad</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Las imágenes se añaden al editarla: necesitan una propiedad a la que
        pertenecer.
      </p>

      <div className="mt-6 rounded-xl border border-line bg-card p-6">
        <PropertyForm features={features} />
      </div>
    </div>
  );
}

/**
 * Características disponibles.
 *
 * Si no se pueden cargar, el formulario sigue sirviendo: se puede dar de
 * alta la propiedad y añadirlas al editarla. Perder el alta entera por esto
 * sería peor.
 */
async function loadFeatures() {
  try {
    return (await fetchAdminFeatures((await cookies()).toString())).data;
  } catch (error) {
    console.error("[admin] No fue posible cargar las características", error);

    return [];
  }
}
