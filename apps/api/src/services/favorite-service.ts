import "server-only";

import type { PropertyCollectionDto } from "@portal/contracts";

import {
  createFavorite,
  deleteFavorite,
  findFavoriteProperties,
  findFavoritePropertyIds,
  findPublishedPropertyId,
} from "@/repositories/favorite-repository";
import { toPropertySummary } from "@/services/property-mapper";

/**
 * Propiedades guardadas por una persona (spec.md, sección 16).
 *
 * Guardar y quitar son idempotentes: repetir la operación deja el mismo
 * resultado y no falla. Es lo que necesita un botón que alterna, donde un
 * doble clic o un reintento no deben convertirse en un error, y coincide con
 * lo que HTTP espera de `DELETE`.
 *
 * Solo se guardan propiedades publicadas. Un borrador no es visible en el
 * portal, así que tampoco puede acabar en la lista de nadie.
 */

export type FavoriteOutcome =
  { readonly status: "ok" } | { readonly status: "property-not-found" };

export async function listFavorites(
  userId: string,
): Promise<PropertyCollectionDto> {
  const properties = await findFavoriteProperties(userId);
  const data = properties.map(toPropertySummary);

  return { data, total: data.length };
}

export function listFavoritePropertyIds(userId: string): Promise<string[]> {
  return findFavoritePropertyIds(userId);
}

export async function addFavorite(
  userId: string,
  propertyId: string,
): Promise<FavoriteOutcome> {
  if (!(await findPublishedPropertyId(propertyId))) {
    return { status: "property-not-found" };
  }

  await createFavorite(userId, propertyId);

  return { status: "ok" };
}

/**
 * Quita una propiedad de la lista.
 *
 * No comprueba que la propiedad exista: si no está guardada, el resultado
 * deseado —que no lo esté— ya se cumple.
 */
export async function removeFavorite(
  userId: string,
  propertyId: string,
): Promise<FavoriteOutcome> {
  await deleteFavorite(userId, propertyId);

  return { status: "ok" };
}
