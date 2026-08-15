import "server-only";

import {
  findProperties,
  findPropertyById,
} from "@/repositories/property-repository";
import { toPropertyDetail, toPropertySummary } from "@/services/property-mapper";
import type { PropertyDetailDto, PropertyListDto } from "@portal/contracts";

/**
 * Reglas de negocio del catálogo público.
 *
 * El portal público solo expone propiedades publicadas (spec.md, sección 8).
 * La restricción se aplica aquí, en el servidor, y no en el cliente: una
 * propiedad despublicada no debe salir nunca por la API pública.
 */

const PUBLIC_FILTER = { isPublished: true } as const;

export async function listPublicProperties(): Promise<PropertyListDto> {
  const properties = await findProperties(PUBLIC_FILTER);
  const data = properties.map(toPropertySummary);

  return { data, total: data.length };
}

export async function getPublicPropertyById(
  id: string,
): Promise<PropertyDetailDto | null> {
  const property = await findPropertyById(id, PUBLIC_FILTER);

  return property ? toPropertyDetail(property) : null;
}
