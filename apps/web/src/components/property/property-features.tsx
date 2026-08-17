import type { PropertyFeatureDto } from "@portal/contracts";

/**
 * Características del inmueble (spec.md, secciones 4 y 12).
 *
 * Es una lista para que las tecnologías de asistencia anuncien cuántas hay.
 * No se renderiza nada si la propiedad no tiene ninguna: un encabezado
 * seguido de vacío sugiere que falló la carga.
 */
export function PropertyFeatures({
  features,
}: {
  readonly features: readonly PropertyFeatureDto[];
}) {
  if (features.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="titulo-caracteristicas">
      <h2
        id="titulo-caracteristicas"
        className="text-xl font-semibold tracking-tight"
      >
        Comodidades
      </h2>

      <ul className="mt-4 flex flex-wrap gap-2">
        {features.map((feature) => (
          <li
            key={feature.id}
            className="rounded-full border border-line px-3 py-1.5 text-sm"
          >
            {feature.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
