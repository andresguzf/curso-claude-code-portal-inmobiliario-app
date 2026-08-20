import type { Metadata } from "next";
import { Suspense } from "react";

import {
  QUERY_PARAM_NAMES,
  isOperationType,
  isPropertySort,
  isPropertyType,
  type OperationTypeValue,
  type PropertyFilterOptionsDto,
  type PropertyListQuery,
  type PropertySortValue,
  type PropertySummaryDto,
  type PropertyTypeValue,
} from "@portal/contracts";

import { CatalogFilters } from "@/components/property/catalog-filters";
import { CatalogSort } from "@/components/property/catalog-sort";
import { CatalogStatus } from "@/components/property/catalog-status";
import { PropertyGrid } from "@/components/property/property-grid";
import { getFavoritePropertyIds } from "@/lib/favorites";
import { PropertyGridSkeleton } from "@/components/property/property-grid-skeleton";
import { fetchFilterOptions, fetchPublicProperties } from "@/lib/api-client";

/** El catálogo refleja el estado de publicación vigente en cada visita. */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Propiedades",
  description:
    "Explora las propiedades en venta y arriendo publicadas en el portal: casas, departamentos, terrenos y oficinas.",
};

const EMPTY_FILTER_OPTIONS: PropertyFilterOptionsDto = {
  communes: [],
  cities: [],
  regions: [],
};

/**
 * La cuadrícula convive con la barra lateral, así que cada tarjeta ocupa
 * aproximadamente la mitad del área de resultados en escritorio.
 */
const GRID_IMAGE_SIZES =
  "(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw";

/**
 * Catálogo público (spec.md, secciones 8 a 11).
 *
 * Muestra únicamente propiedades publicadas, y esa restricción la aplica el
 * backend. Búsqueda, filtros y ordenamiento se resuelven en PostgreSQL: aquí
 * solo se traducen los parámetros de la URL a la consulta REST.
 */
export default async function PropertiesPage({
  searchParams,
}: PageProps<"/properties">) {
  const query = readQuery(await searchParams);
  const options = await loadFilterOptions();

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Propiedades
        </h1>
      </header>

      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        {/*
          La clave remonta el panel cuando cambia la URL. Sin ella, tras una
          navegación de cliente los campos conservarían el estado anterior del
          DOM —`defaultChecked` solo se aplica al montar— y «Limpiar filtros»
          dejaría las casillas marcadas contradiciendo la URL.
        */}
        <CatalogFilters
          key={JSON.stringify(query)}
          query={query}
          options={options}
          hasActiveFilters={hasActiveFilters(query)}
          activeFilterCount={countActiveFilters(query)}
        />

        <div className="min-w-0 flex-1">
          {/*
            La clave reinicia el límite de Suspense cuando cambian los
            parámetros, de modo que el skeleton reaparezca en cada consulta
            nueva en lugar de mostrar los resultados anteriores.
          */}
          <Suspense key={JSON.stringify(query)} fallback={<CatalogLoading />}>
            <CatalogResults query={query} />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

/** Estado de carga: resumen y cuadrícula de marcadores. */
export function CatalogLoading() {
  return (
    <div aria-busy="true">
      <p className="text-base text-ink-muted" role="status">
        Buscando propiedades…
      </p>
      <PropertyGridSkeleton className="mt-8" />
    </div>
  );
}

/**
 * Resultados del catálogo.
 *
 * Es un componente propio para que la espera de la consulta quede dentro del
 * límite de Suspense, y el resto de la página —encabezado y filtros— se
 * muestre de inmediato.
 */
export async function CatalogResults({
  query,
}: {
  readonly query: PropertyListQuery;
}) {
  // Ambas consultas son independientes: se piden a la vez.
  const [catalog, favoritePropertyIds] = await Promise.all([
    loadCatalog(query),
    getFavoritePropertyIds(),
  ]);

  if (catalog.status === "error") {
    return (
      <CatalogStatus
        isError
        title="No pudimos cargar el catálogo"
        description="Hubo un problema al consultar las propiedades. Vuelve a intentarlo en unos minutos."
        action={{ href: "/properties", label: "Reintentar" }}
      />
    );
  }

  if (catalog.total === 0) {
    return hasActiveFilters(query) ? (
      <CatalogStatus
        title="Ninguna propiedad coincide"
        description="Ninguna propiedad cumple con todos los filtros aplicados. Prueba quitando alguno o amplía el rango de precio."
        action={{ href: "/properties", label: "Limpiar filtros" }}
      />
    ) : (
      <CatalogStatus
        title="Todavía no hay propiedades publicadas"
        description="Vuelve pronto: estamos incorporando nuevas propiedades al portal."
      />
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-base text-ink-muted">
          {describeResults(catalog, query)}
        </p>
        <CatalogSort query={query} />
      </div>

      <PropertyGrid
        properties={catalog.properties}
        imageSizes={GRID_IMAGE_SIZES}
        prioritizeFirstImages
        favoritePropertyIds={favoritePropertyIds}
        className="mt-8 lg:grid-cols-2 xl:grid-cols-3"
      />
    </>
  );
}

type RawSearchParams = Record<string, string | string[] | undefined>;

/** Normaliza un parámetro a lista, ya venga repetido o una sola vez. */
function readAll(value: string | string[] | undefined): string[] {
  const values = Array.isArray(value)
    ? value
    : value === undefined
      ? []
      : [value];

  return [...new Set(values.map((item) => item.trim()).filter(Boolean))];
}

/**
 * Toma el primer valor de un parámetro de selección única.
 *
 * Una URL puede repetirlo, en cuyo caso Next entrega un arreglo. Se usa el
 * primero en lugar de fallar.
 */
function readFirst(value: string | string[] | undefined): string {
  return readAll(value)[0] ?? "";
}

function readNumber(value: string | string[] | undefined): number | undefined {
  const raw = readFirst(value);

  if (raw === "") {
    return undefined;
  }

  const parsed = Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function readText(value: string | string[] | undefined): string | undefined {
  const raw = readFirst(value);

  return raw === "" ? undefined : raw;
}

function readList<TValue extends string>(
  value: string | string[] | undefined,
  isValid: (candidate: string) => candidate is TValue,
): TValue[] | undefined {
  const values = readAll(value).filter(isValid);

  return values.length > 0 ? values : undefined;
}

/**
 * Traduce la URL a la consulta de la API.
 *
 * Los valores no reconocidos se descartan en lugar de reenviarse: la API los
 * rechazaría con 400 y la persona vería un error en vez del catálogo.
 * La validación estricta sigue viviendo en el backend.
 */
export function readQuery(searchParams: RawSearchParams): PropertyListQuery {
  const communes = readAll(searchParams[QUERY_PARAM_NAMES.communes]);
  const sort = readFirst(searchParams[QUERY_PARAM_NAMES.sort]);

  return {
    search: readText(searchParams[QUERY_PARAM_NAMES.search]),
    operations: readList<OperationTypeValue>(
      searchParams[QUERY_PARAM_NAMES.operations],
      isOperationType,
    ),
    types: readList<PropertyTypeValue>(
      searchParams[QUERY_PARAM_NAMES.types],
      isPropertyType,
    ),
    minPrice: readNumber(searchParams[QUERY_PARAM_NAMES.minPrice]),
    maxPrice: readNumber(searchParams[QUERY_PARAM_NAMES.maxPrice]),
    bedrooms: readNumber(searchParams[QUERY_PARAM_NAMES.bedrooms]),
    bathrooms: readNumber(searchParams[QUERY_PARAM_NAMES.bathrooms]),
    minUsableArea: readNumber(searchParams[QUERY_PARAM_NAMES.minUsableArea]),
    communes: communes.length > 0 ? communes : undefined,
    city: readText(searchParams[QUERY_PARAM_NAMES.city]),
    region: readText(searchParams[QUERY_PARAM_NAMES.region]),
    sort: isPropertySort(sort) ? (sort as PropertySortValue) : undefined,
  };
}

/**
 * Cuenta los filtros aplicados, contando cada lista como uno.
 *
 * El ordenamiento no se cuenta: no reduce los resultados, solo los reordena,
 * y aparecería como un filtro activo que no se puede quitar desde el panel.
 */
export function countActiveFilters(query: PropertyListQuery): number {
  return Object.entries(query).filter(([key, value]) => {
    if (key === "sort") {
      return false;
    }

    return Array.isArray(value) ? value.length > 0 : value !== undefined;
  }).length;
}

export function hasActiveFilters(query: PropertyListQuery): boolean {
  return countActiveFilters(query) > 0;
}

type Catalog =
  | {
      readonly status: "ready";
      readonly properties: readonly PropertySummaryDto[];
      readonly total: number;
    }
  | { readonly status: "error" };

/**
 * Distingue explícitamente el fallo de la API del catálogo vacío.
 *
 * Si no se separaran, una caída del backend se leería como «no hay
 * propiedades publicadas», que es un mensaje falso.
 */
async function loadCatalog(query: PropertyListQuery): Promise<Catalog> {
  try {
    const { data, total } = await fetchPublicProperties(query);

    return { status: "ready", properties: data, total };
  } catch (error) {
    console.error("[properties] No fue posible cargar el catálogo", error);

    return { status: "error" };
  }
}

/**
 * Las opciones de ubicación son un apoyo del formulario: si fallan, los
 * filtros de comuna, ciudad y región quedan vacíos, pero el catálogo se
 * sigue mostrando.
 */
async function loadFilterOptions(): Promise<PropertyFilterOptionsDto> {
  try {
    return await fetchFilterOptions();
  } catch (error) {
    console.error("[properties] No fue posible cargar los filtros", error);

    return EMPTY_FILTER_OPTIONS;
  }
}

function describeResults(
  catalog: { readonly total: number },
  query: PropertyListQuery,
): string {
  const filtered = hasActiveFilters(query);

  // El adjetivo también concuerda: «1 propiedad publicada», no «publicadas».
  if (catalog.total === 1) {
    return filtered ? "1 propiedad coincide." : "1 propiedad publicada.";
  }

  return filtered
    ? `${catalog.total} propiedades coinciden.`
    : `${catalog.total} propiedades publicadas.`;
}
