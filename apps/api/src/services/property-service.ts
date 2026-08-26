import "server-only";

import {
  PROPERTIES_PER_PAGE,
  type PropertyDetailDto,
  type PropertyFilterOptionsDto,
  type PropertyListDto,
  type PropertyListQuery,
} from "@portal/contracts";

import {
  findLocationValues,
  findProperties,
  findPropertyById,
} from "@/repositories/property-repository";
import { resolvePropertyCoordinates } from "@/services/property-map";
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
  const page = normalizePage(query.page);
  const { properties, total } = await findProperties(query, PUBLIC_SCOPE, {
    skip: (page - 1) * PROPERTIES_PER_PAGE,
    take: PROPERTIES_PER_PAGE,
  });

  return {
    data: properties.map(toPropertySummary),
    // `total` es cuántas hay, no cuántas trae esta página: es lo que permite
    // al portal saber cuántas páginas existen.
    total,
    page,
    pageSize: PROPERTIES_PER_PAGE,
  };
}

/**
 * Página efectiva.
 *
 * Un valor inválido no llega hasta aquí —lo rechaza la validación con un
 * 400—, así que esto solo cubre la ausencia. Pedir una página más allá del
 * final devuelve una lista vacía, que es lo correcto: la página existe, no
 * tiene contenido.
 */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}

export async function getPublicPropertyById(
  id: string,
): Promise<PropertyDetailDto | null> {
  const property = await findPropertyById(id, PUBLIC_SCOPE);

  if (!property) {
    return null;
  }

  return toPropertyDetail(property, {
    coordinates: await resolvePropertyCoordinates(property),
  });
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
