import "server-only";

import { cookies } from "next/headers";
import { cache } from "react";

import type { AuthenticatedUserDto } from "@portal/contracts";

import { fetchCurrentUser } from "@/lib/api-client";

/**
 * Usuario de la sesión, leído desde el servidor.
 *
 * Reenvía las cookies del navegador a la API, porque `fetch` en el servidor
 * no las arrastra solo. Se resuelve antes de pintar, así que el header nunca
 * muestra «Ingresar» a alguien que ya inició sesión.
 *
 * Un fallo al consultar la API se trata como «sin sesión»: el portal público
 * debe seguir viéndose aunque la autenticación esté caída.
 *
 * Va envuelto en `cache` porque la piden el layout, para la barra, y algunas
 * páginas, para rellenar formularios. Sin esto serían dos consultas idénticas
 * por cada visita.
 */
export const getCurrentUser = cache(
  async function getCurrentUser(): Promise<AuthenticatedUserDto | null> {
    try {
      return await fetchCurrentUser((await cookies()).toString());
    } catch (error) {
      console.error("[sesión] No fue posible leer la sesión", error);

      return null;
    }
  },
);
