"use client";

import type { GeoCoordinatesDto } from "@portal/contracts";

import { useGoogleMap } from "@/hooks/use-google-map";

/**
 * Mapa interactivo de la propiedad (spec.md, sección 13).
 *
 * Toda la conversación con Google vive en `useGoogleMap`; aquí solo queda
 * el contenedor y lo que se muestra mientras el mapa llega o si no llega.
 *
 * El mapa no es la única vía para consultar la ubicación: la sección lo
 * acompaña siempre con la dirección en texto y un enlace a Google Maps, que
 * funcionan sin JavaScript.
 */
export function PropertyMap({
  coordinates,
}: {
  readonly coordinates: GeoCoordinatesDto;
}) {
  const { containerRef, status } = useGoogleMap(coordinates);

  return (
    <div className="relative mt-4 overflow-hidden rounded-xl border border-line bg-muted">
      <div ref={containerRef} className="h-64 w-full sm:h-80" />

      {status === "ready" ? null : (
        <p
          className="absolute inset-0 grid place-items-center px-4 text-center text-sm text-ink-muted"
          role={status === "error" ? "status" : undefined}
        >
          {status === "error"
            ? "No pudimos cargar el mapa."
            : "Cargando el mapa…"}
        </p>
      )}
    </div>
  );
}
