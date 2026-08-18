"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef, useState } from "react";

import type { GeoCoordinatesDto } from "@portal/contracts";

/**
 * Dibuja un mapa de Google en un contenedor del DOM.
 *
 * Es uno de los pocos usos legítimos de `useEffect`: sincronizar con un
 * sistema externo. La biblioteca de Google manipula el DOM por su cuenta, así
 * que React solo le presta un contenedor vacío y se aparta.
 *
 * La clave llega desde `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` y es pública por
 * diseño: el mapa se dibuja en el navegador y no hay forma de ocultarla. Se
 * protege restringiéndola por *referrer* en Google Cloud (plan.md, sección 15).
 */

export type GoogleMapStatus = "loading" | "ready" | "error";

/** Nivel de barrio: sitúa la propiedad sin aparentar precisión de portal. */
const MAP_ZOOM = 16;

/**
 * Mapa de demostración de Google, necesario para los marcadores modernos.
 *
 * Un identificador propio se configura en Google Cloud y permite personalizar
 * el estilo; mientras no exista, este sirve y no requiere configuración.
 */
const DEFAULT_MAP_ID = "DEMO_MAP_ID";

/**
 * La configuración es global y debe fijarse antes de cargar ninguna
 * biblioteca, así que se hace una sola vez por página aunque haya varios
 * mapas.
 */
let isConfigured = false;

function configureGoogleMaps(apiKey: string): void {
  if (isConfigured) {
    return;
  }

  setOptions({ key: apiKey, v: "weekly", language: "es", region: "CL" });
  isConfigured = true;
}

/** Solo para pruebas: la configuración vive mientras viva la página. */
export function resetGoogleMapsConfiguration(): void {
  isConfigured = false;
}

export function useGoogleMap(coordinates: GeoCoordinatesDto) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<GoogleMapStatus>("loading");

  const { latitude, longitude } = coordinates;

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
    const container = containerRef.current;

    if (apiKey === "" || container === null) {
      setStatus("error");

      return;
    }

    // Si el componente se desmonta mientras Google responde, no se toca el
    // estado de un componente que ya no existe.
    let isMounted = true;

    configureGoogleMaps(apiKey);

    async function drawMap(target: HTMLDivElement) {
      const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
        importLibrary("maps"),
        importLibrary("marker"),
      ]);

      if (!isMounted) {
        return;
      }

      const position = { lat: latitude, lng: longitude };
      const map = new Map(target, {
        center: position,
        zoom: MAP_ZOOM,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? DEFAULT_MAP_ID,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      new AdvancedMarkerElement({ map, position });

      setStatus("ready");
    }

    drawMap(container).catch((error: unknown) => {
      console.error("[mapa] No fue posible cargar Google Maps", error);

      if (isMounted) {
        setStatus("error");
      }
    });

    return () => {
      isMounted = false;
    };
  }, [latitude, longitude]);

  return { containerRef, status };
}
