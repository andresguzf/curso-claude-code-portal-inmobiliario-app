import { cookies } from "next/headers";
import Link from "next/link";

import type { AdminPropertyPageDto } from "@portal/contracts";

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

/**
 * Administración de propiedades (spec.md, sección 19).
 *
 * A diferencia del catálogo público, aquí se ven también los borradores: es
 * el sitio donde se escriben antes de publicarlos.
 *
 * La búsqueda y la página viven en la URL y las resuelve el servidor, como
 * en el catálogo: traer el listado entero para mostrar diez filas crece con
 * cada propiedad que se dé de alta.
 */
export default async function AdminPropertiesPage({
  searchParams,
}: {
  readonly searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdminUser(PROPERTIES_PATH);

  const parameters = await searchParams;
  const search = readSingle(parameters.search);
  const page = Number(readSingle(parameters.page)) || 1;
  const result = await loadProperties(search, page);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
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

      {result === null ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
          No pudimos cargar las propiedades en este momento. Vuelve a intentarlo
          en unos minutos.
        </p>
      ) : (
        <Listing page={result} search={search} />
      )}
    </div>
  );
}

function Listing({
  page,
  search,
}: {
  readonly page: AdminPropertyPageDto;
  readonly search: string;
}) {
  if (page.data.length === 0) {
    return (
      <p className="mt-4 rounded-xl border border-dashed border-line bg-muted px-5 py-8 text-center text-sm text-ink-muted">
        {search
          ? `Ninguna propiedad coincide con «${search}».`
          : "Todavía no hay propiedades. Crea la primera."}
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
        basePath="/admin/properties"
        currentPage={page.page}
        lastPage={Math.max(1, Math.ceil(page.total / page.pageSize))}
        search={search}
        label="Páginas de propiedades"
      />
    </>
  );
}

/**
 * Listado de propiedades.
 *
 * Un fallo al consultarlo no debe tumbar el panel: se devuelve `null` y la
 * página lo dice, en vez de mostrar un listado vacío que se leería como «no
 * hay ninguna».
 */
async function loadProperties(
  search: string,
  page: number,
): Promise<AdminPropertyPageDto | null> {
  try {
    return await fetchAdminProperties(
      { search, page },
      (await cookies()).toString(),
    );
  } catch (error) {
    console.error("[admin] No fue posible cargar las propiedades", error);

    return null;
  }
}

/** Un parámetro repetido en la URL se queda con el primero. */
function readSingle(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}
