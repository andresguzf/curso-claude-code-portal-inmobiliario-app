import { cookies } from "next/headers";
import Link from "next/link";

import {
  ADMIN_QUERY_PARAM_NAMES,
  type AdminPropertyPageDto,
} from "@portal/contracts";

import {
  PropertyFilters,
  type PropertyFilterValues,
} from "@/components/admin/property-filters";
import { PropertyTable } from "@/components/admin/property-table";
import { Pagination } from "@/components/ui/pagination";
import { SearchForm } from "@/components/ui/search-form";
import { fetchAdminProperties } from "@/lib/api-client";
import { requireAdminUser } from "@/lib/require-user";

/** El listado refleja lo que hay ahora, borradores incluidos. */
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Propiedades",
};

const PROPERTIES_PATH = "/admin/properties";

type RawSearchParams = Record<string, string | string[] | undefined>;

/**
 * Administración de propiedades (spec.md, sección 19).
 *
 * A diferencia del catálogo público, aquí se ven también los borradores: es
 * el sitio donde se escriben antes de publicarlos.
 *
 * La búsqueda, los filtros y la página viven en la URL y los resuelve
 * PostgreSQL, como en el catálogo: traer el listado entero para mostrar diez
 * filas crece con cada propiedad que se dé de alta.
 */
export default async function AdminPropertiesPage({
  searchParams,
}: {
  readonly searchParams: Promise<RawSearchParams>;
}) {
  await requireAdminUser(PROPERTIES_PATH);

  const parameters = toSearchParams(await searchParams);
  const search = parameters.get(ADMIN_QUERY_PARAM_NAMES.search) ?? "";
  const result = await loadProperties(parameters);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propiedades</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Todas las del portal, publicadas y en borrador.
          </p>
        </div>

        <Link
          href="/admin/properties/new"
          className="inline-flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong"
        >
          Nueva propiedad
        </Link>
      </div>

      <SearchForm
        basePath={PROPERTIES_PATH}
        search={search}
        label="Buscar propiedades"
        placeholder="Título, comuna o ciudad…"
        className="mt-6"
      />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          {result === null ? (
            <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
              No pudimos cargar las propiedades con esos filtros. Revisa la
              dirección o quítalos y vuelve a intentarlo.
            </p>
          ) : (
            <Listing page={result} parameters={parameters} />
          )}
        </div>

        <PropertyFilters values={toFilterValues(parameters)} />
      </div>
    </div>
  );
}

function Listing({
  page,
  parameters,
}: {
  readonly page: AdminPropertyPageDto;
  readonly parameters: URLSearchParams;
}) {
  if (page.data.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
        Ninguna propiedad coincide con lo que has pedido.
      </p>
    );
  }

  return (
    <>
      <PropertyTable properties={page.data} />

      <p className="mt-3 text-sm text-ink-muted">
        {page.total === 1 ? "1 propiedad" : `${page.total} propiedades`}
      </p>

      <Pagination
        basePath={PROPERTIES_PATH}
        currentPage={page.page}
        lastPage={Math.max(1, Math.ceil(page.total / page.pageSize))}
        preserved={parameters}
        label="Páginas de propiedades"
      />
    </>
  );
}

/**
 * Los parámetros de la página, como `URLSearchParams`.
 *
 * Next.js los entrega como objeto, y un parámetro repetido —tipo y
 * operación admiten varios— llega como lista. Aquí vuelven a su forma
 * natural, que es la que entienden el cliente REST y el panel de filtros.
 */
function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const parameters = new URLSearchParams();

  for (const [name, value] of Object.entries(raw)) {
    for (const item of Array.isArray(value) ? value : [value ?? ""]) {
      if (item !== "") {
        parameters.append(name, item);
      }
    }
  }

  return parameters;
}

/** Lo que el panel necesita para pintarse marcado como está la URL. */
function toFilterValues(parameters: URLSearchParams): PropertyFilterValues {
  const names = ADMIN_QUERY_PARAM_NAMES;

  return {
    search: parameters.get(names.search) ?? "",
    minPrice: parameters.get(names.minPrice) ?? "",
    maxPrice: parameters.get(names.maxPrice) ?? "",
    status: parameters.get(names.status) ?? "",
    types: parameters.getAll(names.types),
    operations: parameters.getAll(names.operations),
    publishedFrom: parameters.get(names.publishedFrom) ?? "",
    publishedTo: parameters.get(names.publishedTo) ?? "",
  };
}

/**
 * Listado de propiedades.
 *
 * Un fallo al consultarlo no debe tumbar el panel: se devuelve `null` y la
 * página lo dice, en vez de mostrar un listado vacío que se leería como «no
 * hay ninguna». También llega aquí un filtro inválido escrito a mano en la
 * URL, que la API rechaza con 400.
 */
async function loadProperties(
  parameters: URLSearchParams,
): Promise<AdminPropertyPageDto | null> {
  try {
    return await fetchAdminProperties(parameters, (await cookies()).toString());
  } catch (error) {
    console.error("[admin] No fue posible cargar las propiedades", error);

    return null;
  }
}
