"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";

import {
  FILTER_LIMITS,
  MAX_SEARCH_LENGTH,
  OperationType,
  PropertyType,
  QUERY_PARAM_NAMES,
  type PropertyFilterOptionsDto,
  type PropertyListQuery,
} from "@portal/contracts";

import { formatOperationType, formatPropertyType } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Barra lateral de búsqueda y filtros del catálogo
 * (spec.md, secciones 9, 10 y 23).
 *
 * Es un único formulario GET, así que todos los filtros se combinan en la
 * misma URL y el resultado es compartible. No usa Server Actions.
 *
 * Sin JavaScript el formulario se envía de forma nativa y funciona igual.
 * Con JavaScript se intercepta el envío para omitir los campos vacíos: un
 * formulario nativo los incluye todos y produciría URLs como
 * `?search=&minPrice=&city=` en lugar de la forma limpia que ejemplifica la
 * especificación.
 *
 * Elección de controles: casilla cuando el filtro admite varios valores
 * (operación, tipo, comuna), grupo de opciones excluyentes para los mínimos
 * de dormitorios y baños, y lista desplegable donde la selección es única y
 * la lista puede crecer (ciudad, región).
 */

const ROOM_CHOICES = [1, 2, 3, 4, 5] as const;
const BATHROOM_CHOICES = [1, 2, 3, 4] as const;

/**
 * Identificador fijo del panel.
 *
 * No se usa `useId()` porque su valor contiene caracteres que no son válidos
 * en un selector CSS, y el respaldo sin JavaScript necesita referenciarlo.
 * Solo hay un panel de filtros por página.
 */
const PANEL_ID = "catalogo-filtros";

const fieldClasses =
  "w-full rounded-md border border-line bg-card px-3 py-2 text-sm text-ink";

const labelClasses = "mb-1.5 block text-sm font-medium";

const checkboxClasses = "size-4 shrink-0 accent-accent";

/** Compone la URL del catálogo descartando los filtros sin valor. */
export function buildCatalogHref(
  entries: Iterable<readonly [string, string]>,
): string {
  const searchParams = new URLSearchParams();

  for (const [name, value] of entries) {
    const trimmed = value.trim();

    if (trimmed !== "") {
      // `append` y no `set`: los filtros múltiples repiten el parámetro.
      searchParams.append(name, trimmed);
    }
  }

  const queryString = searchParams.toString();

  return queryString ? `/properties?${queryString}` : "/properties";
}

type CatalogFiltersProps = {
  readonly query: PropertyListQuery;
  readonly options: PropertyFilterOptionsDto;
  /** Hay al menos un filtro o búsqueda activa. */
  readonly hasActiveFilters: boolean;
  /** Cuántos filtros están aplicados, para rotularlo al colapsar. */
  readonly activeFilterCount: number;
};

export function CatalogFilters({
  query,
  options,
  hasActiveFilters,
  activeFilterCount,
}: CatalogFiltersProps) {
  const router = useRouter();

  /**
   * El estado se lleva por separado en móvil y en escritorio.
   *
   * El servidor no conoce el ancho de la pantalla, así que en lugar de
   * detectarlo con JavaScript —lo que provocaría un salto visible tras
   * hidratar— cada estado controla su propio punto de ruptura mediante CSS.
   * En móvil el panel arranca cerrado, porque desplegado empujaría los
   * resultados fuera de la vista; en escritorio arranca abierto.
   */
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopOpen, setIsDesktopOpen] = useState(true);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const entries = [...new FormData(event.currentTarget).entries()]
      .filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      )
      .map(([name, value]) => [name, value] as const);

    router.push(buildCatalogHref(entries));
  }

  return (
    <aside
      aria-labelledby={`${PANEL_ID}-titulo`}
      className={cn(
        "shrink-0",
        isDesktopOpen ? "lg:w-72 xl:w-80" : "lg:w-auto",
      )}
    >
      {/*
        Sin JavaScript no hay forma de desplegar el panel, así que se fuerza
        visible: es preferible una página más larga a unos filtros
        inalcanzables.
      */}
      <noscript
        // `dangerouslySetInnerHTML` es la vía admitida para emitir contenido
        // crudo dentro de `noscript`: con hijos JSX React no lo serializa.
        dangerouslySetInnerHTML={{
          __html: `<style>#${PANEL_ID}{display:flex !important}</style>`,
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <h2 id={`${PANEL_ID}-titulo`} className="text-base font-semibold">
          Filtros
          {activeFilterCount > 0 ? (
            <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-white">
              {activeFilterCount}
            </span>
          ) : null}
        </h2>

        {/*
          Dos botones, uno por punto de ruptura. Solo uno está presente en el
          árbol de accesibilidad a la vez, de modo que `aria-expanded` siempre
          describe el estado real de lo que se ve.
        */}
        <PanelToggle
          isOpen={isMobileOpen}
          onToggle={() => setIsMobileOpen((open) => !open)}
          breakpoint="mobile"
          className="lg:hidden"
        />
        <PanelToggle
          isOpen={isDesktopOpen}
          onToggle={() => setIsDesktopOpen((open) => !open)}
          breakpoint="desktop"
          className="hidden lg:inline-block"
        />
      </div>

      <form
        id={PANEL_ID}
        action="/properties"
        method="get"
        role="search"
        aria-label="Búsqueda y filtros"
        onSubmit={handleSubmit}
        className={cn(
          "mt-4 flex-col gap-5 rounded-xl border border-line bg-card p-4 shadow-sm",
          isMobileOpen ? "flex" : "hidden",
          isDesktopOpen ? "lg:flex" : "lg:hidden",
        )}
      >
        <div>
          <label htmlFor={`${PANEL_ID}-busqueda`} className={labelClasses}>
            Buscar
          </label>
          <input
            id={`${PANEL_ID}-busqueda`}
            type="search"
            name={QUERY_PARAM_NAMES.search}
            defaultValue={query.search ?? ""}
            maxLength={MAX_SEARCH_LENGTH}
            placeholder="Comuna, ciudad o palabra clave…"
            autoComplete="off"
            spellCheck={false}
            className={fieldClasses}
          />
        </div>

        <FilterGroup legend="Operación">
          {Object.values(OperationType).map((operation) => (
            <CheckboxOption
              key={operation}
              name={QUERY_PARAM_NAMES.operations}
              value={operation}
              label={formatOperationType(operation)}
              checked={query.operations?.includes(operation) ?? false}
            />
          ))}
        </FilterGroup>

        <FilterGroup legend="Tipo de propiedad" orientation="vertical">
          {Object.values(PropertyType).map((propertyType) => (
            <CheckboxOption
              key={propertyType}
              name={QUERY_PARAM_NAMES.types}
              value={propertyType}
              label={formatPropertyType(propertyType)}
              checked={query.types?.includes(propertyType) ?? false}
            />
          ))}
        </FilterGroup>

        <FilterGroup legend="Precio (USD)">
          <div className="grid w-full grid-cols-2 gap-2">
            <div>
              <label
                htmlFor={`${PANEL_ID}-precio-min`}
                className="mb-1 block text-xs text-ink-muted"
              >
                Desde
              </label>
              <input
                id={`${PANEL_ID}-precio-min`}
                type="number"
                name={QUERY_PARAM_NAMES.minPrice}
                inputMode="numeric"
                min={0}
                max={FILTER_LIMITS.maxPrice}
                defaultValue={query.minPrice ?? ""}
                placeholder="Sin mínimo"
                autoComplete="off"
                className={fieldClasses}
              />
            </div>
            <div>
              <label
                htmlFor={`${PANEL_ID}-precio-max`}
                className="mb-1 block text-xs text-ink-muted"
              >
                Hasta
              </label>
              <input
                id={`${PANEL_ID}-precio-max`}
                type="number"
                name={QUERY_PARAM_NAMES.maxPrice}
                inputMode="numeric"
                min={0}
                max={FILTER_LIMITS.maxPrice}
                defaultValue={query.maxPrice ?? ""}
                placeholder="Sin máximo"
                autoComplete="off"
                className={fieldClasses}
              />
            </div>
          </div>
        </FilterGroup>

        <MinimumChoiceGroup
          legend="Dormitorios"
          name={QUERY_PARAM_NAMES.bedrooms}
          choices={ROOM_CHOICES}
          selected={query.bedrooms}
        />

        <MinimumChoiceGroup
          legend="Baños"
          name={QUERY_PARAM_NAMES.bathrooms}
          choices={BATHROOM_CHOICES}
          selected={query.bathrooms}
        />

        <div>
          <label htmlFor={`${PANEL_ID}-superficie`} className={labelClasses}>
            Superficie útil mínima (m²)
          </label>
          <input
            id={`${PANEL_ID}-superficie`}
            type="number"
            name={QUERY_PARAM_NAMES.minUsableArea}
            inputMode="numeric"
            min={0}
            max={FILTER_LIMITS.maxUsableArea}
            defaultValue={query.minUsableArea ?? ""}
            placeholder="Sin mínimo"
            autoComplete="off"
            className={fieldClasses}
          />
        </div>

        <CommuneGroup
          values={options.communes}
          selected={query.communes ?? []}
        />

        <div>
          <label htmlFor={`${PANEL_ID}-ciudad`} className={labelClasses}>
            Ciudad
          </label>
          <LocationSelect
            id={`${PANEL_ID}-ciudad`}
            name={QUERY_PARAM_NAMES.city}
            emptyLabel="Todas las ciudades"
            values={options.cities}
            selected={query.city}
          />
        </div>

        <div>
          <label htmlFor={`${PANEL_ID}-region`} className={labelClasses}>
            Región
          </label>
          <LocationSelect
            id={`${PANEL_ID}-region`}
            name={QUERY_PARAM_NAMES.region}
            emptyLabel="Todas las regiones"
            values={options.regions}
            selected={query.region}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="submit"
            className="rounded-md bg-accent px-5 py-2 text-sm font-semibold text-white transition-opacity hover:bg-accent-strong"
          >
            Aplicar filtros
          </button>

          {hasActiveFilters ? (
            // Enlace y no botón: limpiar es navegar al catálogo sin parámetros.
            <Link
              href="/properties"
              className="rounded-md border border-line px-5 py-2 text-center text-sm font-medium transition-colors hover:bg-muted"
            >
              Limpiar filtros
            </Link>
          ) : null}
        </div>
      </form>
    </aside>
  );
}

function PanelToggle({
  isOpen,
  onToggle,
  breakpoint,
  className,
}: {
  readonly isOpen: boolean;
  readonly onToggle: () => void;
  /**
   * Punto de ruptura al que corresponde este botón. Los dos comparten nombre
   * accesible, y solo uno se muestra a la vez, así que este atributo permite
   * identificarlos sin depender de las clases de Tailwind.
   */
  readonly breakpoint: "mobile" | "desktop";
  readonly className: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={PANEL_ID}
      // El ícono no transmite texto, así que el nombre accesible es explícito.
      aria-label={isOpen ? "Ocultar filtros" : "Mostrar filtros"}
      data-breakpoint={breakpoint}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-md border border-line transition-colors hover:bg-muted ",
        className,
      )}
    >
      <ToggleIcon breakpoint={breakpoint} isOpen={isOpen} />
    </button>
  );
}

/**
 * Ícono del control de colapso.
 *
 * La dirección refleja hacia dónde se mueve el panel, y eso depende de su
 * posición: en escritorio es una barra lateral que se retrae hacia la
 * izquierda, así que se usan dobles galones horizontales; en móvil es un
 * bloque que se despliega hacia abajo, así que el galón es vertical.
 */
function ToggleIcon({
  breakpoint,
  isOpen,
}: {
  readonly breakpoint: "mobile" | "desktop";
  readonly isOpen: boolean;
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
      className="size-5"
    >
      {breakpoint === "desktop" ? (
        isOpen ? (
          <>
            <path d="M11 17l-5-5 5-5" />
            <path d="M18 17l-5-5 5-5" />
          </>
        ) : (
          <>
            <path d="M13 7l5 5-5 5" />
            <path d="M6 7l5 5-5 5" />
          </>
        )
      ) : isOpen ? (
        <path d="M6 15l6-6 6 6" />
      ) : (
        <path d="M6 9l6 6 6-6" />
      )}
    </svg>
  );
}

function FilterGroup({
  legend,
  orientation = "horizontal",
  children,
}: {
  readonly legend: string;
  /**
   * Los grupos con muchas opciones se apilan: en una barra lateral estrecha
   * las casillas en fila se cortan a media palabra y cuesta recorrerlas.
   */
  readonly orientation?: "horizontal" | "vertical";
  readonly children: ReactNode;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div
        className={cn(
          "flex",
          orientation === "vertical"
            ? "flex-col gap-2"
            : "flex-wrap gap-x-4 gap-y-2",
        )}
      >
        {children}
      </div>
    </fieldset>
  );
}

function CheckboxOption({
  name,
  value,
  label,
  checked,
}: {
  readonly name: string;
  readonly value: string;
  readonly label: string;
  readonly checked: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={checked}
        className={checkboxClasses}
      />
      {label}
    </label>
  );
}

/**
 * Mínimos de dormitorios y baños.
 *
 * Son opciones excluyentes —no tiene sentido pedir «2 o más» y «4 o más» a la
 * vez— así que se usan botones de radio con una opción explícita para no
 * filtrar. El rótulo dice «o más» porque el filtro es un mínimo.
 *
 * Se apilan en vertical: con seis opciones en fila los rótulos «3 o más» se
 * parten entre líneas y el grupo se vuelve difícil de leer.
 */
function MinimumChoiceGroup({
  legend,
  name,
  choices,
  selected,
}: {
  readonly legend: string;
  readonly name: string;
  readonly choices: readonly number[];
  readonly selected: number | undefined;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-col gap-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value=""
            defaultChecked={selected === undefined}
            className={checkboxClasses}
          />
          Cualquiera
        </label>

        {choices.map((count) => (
          <label key={count} className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name={name}
              value={count}
              defaultChecked={selected === count}
              className={checkboxClasses}
            />
            {count} o más
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/**
 * Comunas como casillas, para poder combinar varias
 * (`?commune=Las+Condes&commune=Providencia`).
 *
 * La lista se limita en alto y desplaza: en producción una región puede tener
 * decenas de comunas y el resto del panel quedaría fuera de la vista.
 */
function CommuneGroup({
  values,
  selected,
}: {
  readonly values: readonly string[];
  readonly selected: readonly string[];
}) {
  /**
   * Si la URL trae una comuna que ya no está en la lista —por ejemplo porque
   * su única propiedad se despublicó— se agrega para no perder en silencio el
   * filtro que la persona pidió.
   */
  const missingSelected = selected.filter((value) => !values.includes(value));
  const allValues = [...missingSelected, ...values];

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">Comuna</legend>

      {allValues.length === 0 ? (
        <p className="text-sm text-ink-muted">Sin comunas disponibles.</p>
      ) : (
        <div className="max-h-56 overflow-y-auto rounded-md border border-line p-2">
          <div className="flex flex-col gap-2">
            {allValues.map((value) => (
              <CheckboxOption
                key={value}
                name={QUERY_PARAM_NAMES.communes}
                value={value}
                label={value}
                checked={selected.includes(value)}
              />
            ))}
          </div>
        </div>
      )}
    </fieldset>
  );
}

function LocationSelect({
  id,
  name,
  emptyLabel,
  values,
  selected,
}: {
  readonly id: string;
  readonly name: string;
  readonly emptyLabel: string;
  readonly values: readonly string[];
  readonly selected: string | undefined;
}) {
  const knownValues =
    selected && !values.includes(selected) ? [selected, ...values] : values;

  return (
    <select
      id={id}
      name={name}
      defaultValue={selected ?? ""}
      className={fieldClasses}
    >
      <option value="">{emptyLabel}</option>
      {knownValues.map((value) => (
        <option key={value} value={value}>
          {value}
        </option>
      ))}
    </select>
  );
}
