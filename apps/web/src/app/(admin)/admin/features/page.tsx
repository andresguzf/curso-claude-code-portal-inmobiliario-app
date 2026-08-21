import { cookies } from "next/headers";

import type { AdminFeatureDto } from "@portal/contracts";

import { FeatureManager } from "@/components/admin/feature-manager";
import { fetchAdminFeatures } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";

/** La lista cambia en cuanto se da de alta una característica. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Características",
};

const FEATURES_PATH = "/admin/features";

/**
 * Características del inmueble (spec.md, sección 4).
 *
 * Añadir una es dar de alta una fila. `Property` no tiene una columna por
 * característica, así que ampliar el vocabulario no exige ni migración ni
 * despliegue: es justo lo que esta pantalla existe para permitir.
 */
export default async function AdminFeaturesPage() {
  await requireAdminUser(FEATURES_PATH);

  const features = await loadFeatures();

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Características</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Las que puede declarar una propiedad. El identificador se deriva del
        nombre y no cambia al renombrarla, porque es con lo que las fichas
        quedan enlazadas.
      </p>

      <div className="mt-6">
        {features === null ? (
          <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
            No pudimos cargar las características en este momento. Vuelve a
            intentarlo en unos minutos.
          </p>
        ) : (
          <FeatureManager features={features} />
        )}
      </div>
    </div>
  );
}

/**
 * Un fallo al consultarlas no debe tumbar el panel: se devuelve `null` y la
 * página lo dice, en vez de una lista vacía que se leería como «no hay
 * ninguna» e invitaría a crear duplicados.
 */
async function loadFeatures(): Promise<readonly AdminFeatureDto[] | null> {
  try {
    return (await fetchAdminFeatures((await cookies()).toString())).data;
  } catch (error) {
    console.error("[admin] No fue posible cargar las características", error);

    return null;
  }
}
