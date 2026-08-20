import { cookies } from "next/headers";
import Link from "next/link";

import type { AdminOverviewDto } from "@portal/contracts";

import { fetchAdminOverview } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";

/** Los indicadores reflejan el estado vigente en cada visita. */
export const dynamic = "force-dynamic";

/** El layout añade « | Administración» mediante su plantilla de título. */
export const metadata = {
  title: "Resumen",
};

const ADMIN_PATH = "/admin";

/**
 * Panel de administración (spec.md, sección 18).
 *
 * La guarda decide antes de pintar: a quien no ha entrado se le lleva al
 * login, y a un USER autenticado se le responde «no existe». Es el mismo
 * criterio que usa la API con las propiedades en borrador: si no puedes
 * verlo, tampoco puedes averiguar que está ahí.
 */
export default async function AdminPage() {
  const admin = await requireAdminUser(ADMIN_PATH);
  const overview = await loadOverview();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight">Administración</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Hola, {admin.name}. Este es el estado del portal.
      </p>

      {overview === null ? (
        <p className="mt-8 rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          No pudimos cargar los indicadores en este momento. Vuelve a intentarlo
          en unos minutos.
        </p>
      ) : (
        <Indicators overview={overview} />
      )}

      <p className="mt-8 text-sm text-ink-muted">
        <Link
          href="/properties"
          className="rounded-sm underline underline-offset-4 transition-colors hover:text-accent"
        >
          Ver el portal público
        </Link>
      </p>
    </div>
  );
}

function Indicators({ overview }: { readonly overview: AdminOverviewDto }) {
  const indicators = [
    {
      label: "Propiedades",
      value: overview.totalProperties,
      hint: "Incluye borradores",
    },
    {
      label: "Publicadas",
      value: overview.publishedProperties,
      hint: "Visibles en el portal",
    },
    { label: "En venta", value: overview.propertiesForSale },
    { label: "En arriendo", value: overview.propertiesForRent },
    { label: "Usuarios", value: overview.users },
    { label: "Consultas", value: overview.inquiries },
  ];

  return (
    <dl className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {indicators.map((indicator) => (
        <div
          key={indicator.label}
          className="flex flex-col gap-1 rounded-xl border border-line bg-card p-5"
        >
          <dt className="text-sm font-medium text-ink-muted">
            {indicator.label}
          </dt>
          <dd className="text-3xl font-semibold tracking-tight text-ink">
            {indicator.value}
          </dd>
          {indicator.hint ? (
            <p className="text-xs text-ink-muted">{indicator.hint}</p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}

/**
 * Indicadores del portal.
 *
 * Un fallo al consultarlos no debe tumbar el panel: se devuelve `null` y la
 * página lo dice.
 */
async function loadOverview(): Promise<AdminOverviewDto | null> {
  try {
    return await fetchAdminOverview((await cookies()).toString());
  } catch (error) {
    console.error("[admin] No fue posible cargar los indicadores", error);

    return null;
  }
}
