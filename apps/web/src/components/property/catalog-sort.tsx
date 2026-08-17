"use client";

import { useRouter } from "next/navigation";
import type { ChangeEvent } from "react";

import {
  DEFAULT_PROPERTY_SORT,
  PropertySort,
  QUERY_PARAM_NAMES,
  type PropertyListQuery,
  type PropertySortValue,
} from "@portal/contracts";

import { buildPropertyQueryString } from "@/lib/api-client";

/**
 * Selector de ordenamiento del catálogo (spec.md, sección 11).
 *
 * Cambiar el orden navega a la misma URL con el parámetro `sort` añadido, de
 * modo que el orden queda representado en la URL y es compartible, igual que
 * los filtros.
 *
 * Sin JavaScript sigue siendo utilizable: es un formulario GET con su propio
 * botón de envío, que se oculta cuando hay JavaScript porque entonces el
 * cambio se aplica al instante.
 */

const SORT_LABELS: Record<PropertySortValue, string> = {
  [PropertySort.NEWEST]: "Más recientes",
  [PropertySort.PRICE_ASC]: "Precio: menor a mayor",
  [PropertySort.PRICE_DESC]: "Precio: mayor a menor",
  [PropertySort.AREA_ASC]: "Superficie: menor a mayor",
  [PropertySort.AREA_DESC]: "Superficie: mayor a menor",
};

const SELECT_ID = "catalogo-orden";

type CatalogSortProps = {
  /** Filtros vigentes, que deben conservarse al cambiar el orden. */
  readonly query: PropertyListQuery;
};

export function CatalogSort({ query }: CatalogSortProps) {
  const router = useRouter();

  function handleChange(event: ChangeEvent<HTMLSelectElement>) {
    const sort = event.currentTarget.value as PropertySortValue | "";

    router.push(
      `/properties${buildPropertyQueryString({
        ...query,
        sort: sort === "" ? undefined : sort,
      })}`,
    );
  }

  return (
    <form action="/properties" method="get" className="flex items-end gap-2">
      {/*
        Los filtros vigentes viajan como campos ocultos para que el envío
        nativo —sin JavaScript— no los pierda al cambiar el orden.
      */}
      <HiddenFilters query={query} />

      <div>
        <label htmlFor={SELECT_ID} className="mb-1.5 block text-sm font-medium">
          Ordenar por
        </label>
        <select
          id={SELECT_ID}
          name={QUERY_PARAM_NAMES.sort}
          defaultValue={query.sort ?? DEFAULT_PROPERTY_SORT}
          onChange={handleChange}
          className="rounded-md border border-line bg-card px-3 py-2 text-sm text-ink"
        >
          {Object.values(PropertySort).map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABELS[sort]}
            </option>
          ))}
        </select>
      </div>

      <noscript>
        <button
          type="submit"
          className="rounded-md border border-line px-4 py-2 text-sm font-medium"
        >
          Ordenar
        </button>
      </noscript>
    </form>
  );
}

/** Reenvía los filtros aplicados como campos ocultos. */
function HiddenFilters({ query }: { readonly query: PropertyListQuery }) {
  const fields: { readonly name: string; readonly value: string }[] = [];

  for (const [key, paramName] of Object.entries(QUERY_PARAM_NAMES)) {
    if (key === "sort") {
      continue;
    }

    const value = query[key as keyof PropertyListQuery];

    if (value === undefined) {
      continue;
    }

    for (const item of Array.isArray(value) ? value : [value]) {
      fields.push({ name: paramName, value: String(item) });
    }
  }

  return (
    <>
      {fields.map((field, index) => (
        <input
          key={`${field.name}-${index}`}
          type="hidden"
          name={field.name}
          value={field.value}
        />
      ))}
    </>
  );
}
