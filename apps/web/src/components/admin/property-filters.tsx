"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  ADMIN_QUERY_PARAM_NAMES,
  AdminPropertyStatus,
  OperationType,
  PropertyType,
  type AdminPropertyStatusValue,
} from "@portal/contracts";

import { fieldInputClassName } from "@/components/form/form-field";
import { formatOperationType, formatPropertyType } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Filtros del listado de propiedades (spec.md, sección 19).
 *
 * Panel colapsable a la derecha: a la izquierda ya está la barra de
 * secciones, y dos barras enfrentadas dejarían la tabla sin sitio.
 *
 * Es un único formulario GET, así que todos los filtros se combinan en la
 * misma URL y el resultado es compartible. Sin JavaScript se envía de forma
 * nativa y funciona igual; con JavaScript se intercepta para omitir los
 * campos vacíos, que si no llenarían la URL de `?minPrice=&status=`.
 *
 * No lleva la página: enviarlo vuelve a la primera, que es lo correcto
 * porque la que se estaba viendo no tiene por qué existir en el resultado
 * filtrado.
 */

const BASE_PATH = "/admin/properties";

/** Identificador fijo: solo hay un panel por página y `useId` no vale aquí. */
const PANEL_ID = "filtros-propiedades";

const STATUS_CHOICES: readonly {
  readonly value: AdminPropertyStatusValue;
  readonly label: string;
}[] = [
  { value: AdminPropertyStatus.ALL, label: "Todas" },
  { value: AdminPropertyStatus.PUBLISHED, label: "Publicadas" },
  { value: AdminPropertyStatus.DRAFT, label: "Borradores" },
];

export type PropertyFilterValues = {
  readonly search: string;
  readonly minPrice: string;
  readonly maxPrice: string;
  readonly status: string;
  readonly types: readonly string[];
  readonly operations: readonly string[];
  readonly publishedFrom: string;
  readonly publishedTo: string;
};

/**
 * Cuántos filtros están aplicados.
 *
 * El estado «todas» no cuenta: es la ausencia del filtro. La búsqueda
 * tampoco, porque tiene su propio campo a la vista y no se esconde al
 * contraer el panel.
 */
export function countActiveFilters(values: PropertyFilterValues): number {
  return [
    values.minPrice !== "",
    values.maxPrice !== "",
    values.status !== "" && values.status !== AdminPropertyStatus.ALL,
    values.types.length > 0,
    values.operations.length > 0,
    values.publishedFrom !== "",
    values.publishedTo !== "",
  ].filter(Boolean).length;
}

/** Empieza por «Filtros», que es lo que se ve: el nombre no contradice al ojo. */
function describeFilterCount(activeCount: number): string {
  if (activeCount === 0) {
    return "Filtros";
  }

  return activeCount === 1
    ? "Filtros, 1 aplicado"
    : `Filtros, ${activeCount} aplicados`;
}

export function PropertyFilters({
  values,
}: {
  readonly values: PropertyFilterValues;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const activeCount = countActiveFilters(values);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parameters = new URLSearchParams();

    for (const [name, value] of new FormData(event.currentTarget).entries()) {
      if (typeof value !== "string" || value.trim() === "") {
        continue;
      }

      // «Todas» es la ausencia del filtro: no tiene por qué viajar.
      if (
        name === ADMIN_QUERY_PARAM_NAMES.status &&
        value === AdminPropertyStatus.ALL
      ) {
        continue;
      }

      parameters.append(name, value.trim());
    }

    const query = parameters.toString();

    router.push(`${BASE_PATH}${query ? `?${query}` : ""}`);
  }

  return (
    <aside className="lg:w-72 lg:shrink-0">
      <div className="rounded-xl border border-line bg-card">
        <h2>
          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            aria-expanded={isOpen}
            aria-controls={PANEL_ID}
            // El nombre accesible dice cuántos hay puestos. La cifra sola, al
            // lado del texto, se leería pegada: «Filtros2».
            aria-label={describeFilterCount(activeCount)}
            className="flex min-h-11 w-full items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-ink"
          >
            Filtros
            {activeCount > 0 ? (
              <span
                aria-hidden="true"
                className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-ink"
              >
                {activeCount}
              </span>
            ) : null}
            <ChevronIcon className="ml-auto" isPointingUp={isOpen} />
          </button>
        </h2>

        <form
          id={PANEL_ID}
          method="get"
          action={BASE_PATH}
          onSubmit={submit}
          hidden={!isOpen}
          className="flex flex-col gap-5 border-t border-line px-4 py-4"
        >
          {/* La búsqueda tiene su propio campo arriba; sin esto, filtrar la
              perdería. */}
          {values.search ? (
            <input
              type="hidden"
              name={ADMIN_QUERY_PARAM_NAMES.search}
              value={values.search}
            />
          ) : null}

          <Group title="Estado">
            {STATUS_CHOICES.map((choice) => (
              <Choice
                key={choice.value}
                type="radio"
                name={ADMIN_QUERY_PARAM_NAMES.status}
                value={choice.value}
                label={choice.label}
                isChecked={
                  choice.value === AdminPropertyStatus.ALL
                    ? values.status === "" ||
                      values.status === AdminPropertyStatus.ALL
                    : values.status === choice.value
                }
              />
            ))}
          </Group>

          <Group title="Operación">
            {Object.values(OperationType).map((operation) => (
              <Choice
                key={operation}
                type="checkbox"
                name={ADMIN_QUERY_PARAM_NAMES.operations}
                value={operation}
                label={formatOperationType(operation)}
                isChecked={values.operations.includes(operation)}
              />
            ))}
          </Group>

          <Group title="Tipo">
            {Object.values(PropertyType).map((type) => (
              <Choice
                key={type}
                type="checkbox"
                name={ADMIN_QUERY_PARAM_NAMES.types}
                value={type}
                label={formatPropertyType(type)}
                isChecked={values.types.includes(type)}
              />
            ))}
          </Group>

          <Group title="Precio (USD)">
            <div className="flex gap-2">
              <RangeField
                id="filtro-precio-min"
                name={ADMIN_QUERY_PARAM_NAMES.minPrice}
                label="Desde"
                type="number"
                defaultValue={values.minPrice}
              />
              <RangeField
                id="filtro-precio-max"
                name={ADMIN_QUERY_PARAM_NAMES.maxPrice}
                label="Hasta"
                type="number"
                defaultValue={values.maxPrice}
              />
            </div>
          </Group>

          <Group title="Publicada entre">
            <div className="flex flex-col gap-2">
              <RangeField
                id="filtro-fecha-desde"
                name={ADMIN_QUERY_PARAM_NAMES.publishedFrom}
                label="Desde"
                type="date"
                defaultValue={values.publishedFrom}
              />
              <RangeField
                id="filtro-fecha-hasta"
                name={ADMIN_QUERY_PARAM_NAMES.publishedTo}
                label="Hasta"
                type="date"
                defaultValue={values.publishedTo}
              />
            </div>
            <p className="text-xs text-ink-muted">
              Un borrador que nunca salió al portal no tiene fecha, así que no
              aparece al filtrar por ella.
            </p>
          </Group>

          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              type="submit"
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-accent px-4 text-sm font-semibold text-on-dark transition-colors hover:bg-accent-strong"
            >
              Aplicar
            </button>

            {activeCount > 0 ? (
              <a
                href={buildClearHref(values.search)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-muted"
              >
                Limpiar
              </a>
            ) : null}
          </div>
        </form>
      </div>
    </aside>
  );
}

/**
 * Limpiar quita los filtros, no la búsqueda.
 *
 * Son dos cosas distintas y están en dos sitios distintos de la interfaz;
 * borrar de paso lo que se escribió arriba sorprendería.
 */
function buildClearHref(search: string): string {
  if (!search) {
    return BASE_PATH;
  }

  const parameters = new URLSearchParams({
    [ADMIN_QUERY_PARAM_NAMES.search]: search,
  });

  return `${BASE_PATH}?${parameters.toString()}`;
}

function Group({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-xs font-semibold tracking-wide text-ink-muted uppercase">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/**
 * Una opción del filtro.
 *
 * La etiqueta envuelve al control, así que toda la fila es zona de pulsación
 * y no quedan huecos muertos entre la casilla y su texto.
 */
function Choice({
  type,
  name,
  value,
  label,
  isChecked,
}: {
  readonly type: "radio" | "checkbox";
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly isChecked: boolean;
}) {
  return (
    <label className="flex min-h-9 items-center gap-2 text-sm text-ink">
      <input
        type={type}
        name={name}
        value={value}
        defaultChecked={isChecked}
        className="size-4 shrink-0 accent-accent"
      />
      {label}
    </label>
  );
}

function RangeField({
  id,
  name,
  label,
  type,
  defaultValue,
}: {
  readonly id: string;
  readonly name: string;
  readonly label: string;
  readonly type: "number" | "date";
  readonly defaultValue: string;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1">
      <label htmlFor={id} className="text-xs text-ink-muted">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        min={type === "number" ? "0" : undefined}
        step={type === "number" ? "1" : undefined}
        autoComplete="off"
        defaultValue={defaultValue}
        className={cn(fieldInputClassName(false), "text-sm")}
      />
    </div>
  );
}

function ChevronIcon({
  isPointingUp,
  className,
}: {
  readonly isPointingUp: boolean;
  readonly className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-5 shrink-0 text-ink-muted", className)}
    >
      <path d={isPointingUp ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} />
    </svg>
  );
}
