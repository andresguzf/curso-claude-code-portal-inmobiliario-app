import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import { fetchFavoriteIds } from "@/lib/api-client";

/**
 * Identificadores guardados por quien visita, leídos desde el servidor.
 *
 * Devuelve `undefined` cuando no hay sesión, y un conjunto —posiblemente
 * vacío— cuando la hay. La diferencia importa: quien no ha entrado no debe
 * ver el botón de guardar, y quien ha entrado y aún no guardó nada sí.
 *
 * Esa distinción la da la propia API, que responde 401 sin sesión y una lista
 * vacía con ella. No hace falta preguntar aparte quién es.
 *
 * Un fallo también se traduce en `undefined`: el catálogo debe seguir
 * viéndose aunque los favoritos no se puedan consultar.
 *
 * Va envuelto en `cache` porque lo piden a la vez el layout —para el contador
 * de la barra— y la página —para marcar las tarjetas—. Sin esto serían dos
 * consultas idénticas por cada visita.
 */
export const getFavoritePropertyIds = cache(
  async function getFavoritePropertyIds(): Promise<
    ReadonlySet<string> | undefined
  > {
    const cookieHeader = (await cookies()).toString();

    if (!cookieHeader) {
      return undefined;
    }

    try {
      const { propertyIds } = await fetchFavoriteIds(cookieHeader);

      return new Set(propertyIds);
    } catch {
      return undefined;
    }
  },
);
