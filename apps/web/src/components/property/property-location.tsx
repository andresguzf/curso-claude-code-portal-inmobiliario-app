import type {
  GeoCoordinatesDto,
  PropertyLocation as PropertyLocationFields,
} from "@portal/contracts";

import { PropertyMap } from "@/components/property/property-map";
import { formatFullLocation } from "@/lib/format";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";

/**
 * Ubicación de la propiedad en el detalle (spec.md, sección 13).
 *
 * Las coordenadas las resuelve el backend a partir de la dirección, y el
 * navegador solo las dibuja: ADMIN nunca escribe latitud ni longitud
 * (spec.md, sección 6).
 *
 * El enlace a Google Maps se muestra siempre, incluso sin mapa y sin
 * JavaScript: es una búsqueda pública que no requiere clave, y es la vía a la
 * ubicación cuando el mapa no puede dibujarse.
 */
export function PropertyLocation({
  location,
  coordinates,
}: {
  readonly location: PropertyLocationFields;
  readonly coordinates: GeoCoordinatesDto | null;
}) {
  const fullAddress = formatFullLocation(location);

  return (
    <section aria-labelledby="titulo-ubicacion">
      <h2
        id="titulo-ubicacion"
        className="text-xl font-semibold tracking-tight"
      >
        Ubicación
      </h2>

      <address className="mt-4 text-base not-italic text-ink">
        {fullAddress}
      </address>

      {coordinates === null ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-muted px-4 py-10 text-center text-sm text-ink-muted">
          El mapa no está disponible en este momento.
        </p>
      ) : (
        <PropertyMap coordinates={coordinates} />
      )}

      <p className="mt-4">
        <a
          href={buildGoogleMapsSearchUrl(location)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-6 items-center rounded-sm py-1 text-sm font-medium text-accent underline underline-offset-4 transition-colors hover:text-accent-strong"
        >
          Ver en Google Maps
          <span className="sr-only"> (se abre en una pestaña nueva)</span>
        </a>
      </p>
    </section>
  );
}
