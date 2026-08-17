import type { PropertyDetailDto } from "@portal/contracts";

import { formatAge, formatArea } from "@/lib/format";

/**
 * Características numéricas de la propiedad (spec.md, sección 12).
 *
 * Se omiten los datos que la propiedad no declara en lugar de mostrarlos
 * vacíos o en cero: un terreno sin dormitorios no tiene «0 dormitorios», no
 * tiene el dato.
 */

type Specification = {
  readonly label: string;
  readonly value: string;
};

export function buildSpecifications(
  property: PropertyDetailDto,
): Specification[] {
  const candidates: readonly (readonly [string, string | null])[] = [
    ["Superficie útil", formatArea(property.usableAreaSquareMeters)],
    ["Superficie total", formatArea(property.totalAreaSquareMeters)],
    [
      "Dormitorios",
      property.bedrooms === null ? null : String(property.bedrooms),
    ],
    ["Baños", property.bathrooms === null ? null : String(property.bathrooms)],
    [
      "Estacionamientos",
      property.parkingSpaces === null ? null : String(property.parkingSpaces),
    ],
    ["Antigüedad", formatAge(property.ageYears)],
  ];

  return candidates
    .filter((entry): entry is readonly [string, string] => entry[1] !== null)
    .map(([label, value]) => ({ label, value }));
}

export function PropertySpecifications({
  property,
}: {
  readonly property: PropertyDetailDto;
}) {
  const specifications = buildSpecifications(property);

  if (specifications.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="titulo-caracteristicas-numericas">
      <h2
        id="titulo-caracteristicas-numericas"
        className="text-xl font-semibold tracking-tight"
      >
        Características
      </h2>

      <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        {specifications.map((specification) => (
          <div key={specification.label}>
            <dt className="text-sm text-ink-muted">{specification.label}</dt>
            <dd className="mt-0.5 text-base font-medium">
              {specification.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
