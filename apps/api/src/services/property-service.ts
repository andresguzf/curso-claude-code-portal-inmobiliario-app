import "server-only";

import type {
  PropertyDetailDto,
  PropertyFilterOptionsDto,
  PropertyListDto,
  PropertyListQuery,
} from "@portal/contracts";

import {
  findLocationValues,
  findProperties,
  findPropertyById,
} from "@/repositories/property-repository";
import {
  toPropertyDetail,
  toPropertySummary,
} from "@/services/property-mapper";

/**
 * Reglas de negocio del catálogo público.
 *
 * El portal público solo expone propiedades publicadas (spec.md, sección 8).
 * La restricción se aplica aquí, en el servidor, y no en el cliente: una
 * propiedad despublicada no debe salir nunca por la API pública.
 */

const PUBLIC_SCOPE = { isPublished: true } as const;

export async function listPublicProperties(
  query: PropertyListQuery = {},
): Promise<PropertyListDto> {
  const properties = await findProperties(query, PUBLIC_SCOPE);
  const data = properties.map(toPropertySummary);

  return { data, total: data.length };
}

export async function getPublicPropertyById(
  id: string,
): Promise<PropertyDetailDto | null> {
  const property = await findPropertyById(id, PUBLIC_SCOPE);

  return property ? toPropertyDetail(property) : null;
}

/**
 * Ubicaciones disponibles para los filtros.
 *
 * Solo considera propiedades publicadas: ofrecer una comuna que únicamente
 * existe en borradores revelaría información del panel de administración y
 * llevaría a un filtro sin resultados.
 */
export function listPublicFilterOptions(): Promise<PropertyFilterOptionsDto> {
  return findLocationValues(PUBLIC_SCOPE);
}
