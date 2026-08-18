import Image from "next/image";

import type { PropertyLocation as PropertyLocationFields } from "@portal/contracts";

import { formatFullLocation } from "@/lib/format";
import { buildGoogleMapsSearchUrl } from "@/lib/google-maps";

/**
 * Ubicación de la propiedad en el detalle (spec.md, sección 13).
 *
 * El mapa se pide a la propia aplicación, no a Google: `mapImageUrl` apunta a
 * un endpoint del backend que reenvía la imagen de la Maps Static API. La
 * clave se queda en el servidor, y por eso el navegador no sabe —ni necesita
 * saber— si la integración está configurada.
 *
 * El enlace a Google Maps se muestra siempre, incluso sin mapa: es una
 * búsqueda pública que no requiere clave y permite ampliar y desplazarse,
 * cosa que una imagen no permite.
 */
export function PropertyLocation({
  location,
  mapImageUrl,
}: {
  readonly location: PropertyLocationFields;
  readonly mapImageUrl: string | null;
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

      {mapImageUrl === null ? (
        <p className="mt-4 rounded-xl border border-dashed border-line bg-muted px-4 py-10 text-center text-sm text-ink-muted">
          El mapa no está disponible en este momento.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-line bg-muted">
          <Image
            src={mapImageUrl}
            alt="Mapa con la ubicación aproximada de la propiedad"
            width={1280}
            height={720}
            className="h-auto w-full"
            /* El backend ya entrega la imagen en el tamaño exacto que se
               muestra: optimizarla otra vez añadiría un salto sin beneficio. */
            unoptimized
          />
        </div>
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
