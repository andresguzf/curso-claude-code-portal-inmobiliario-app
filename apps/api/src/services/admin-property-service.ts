import "server-only";

import {
  ADMIN_PROPERTIES_PER_PAGE,
  type AdminPropertyDto,
  type AdminPropertyListQuery,
  type AdminPropertyPageDto,
  type PropertyInputDto,
} from "@portal/contracts";

import {
  createProperty,
  markPropertyAsDeleted,
  findAdminProperties,
  findAdminPropertyById,
  updateProperty,
} from "@/repositories/admin-property-repository";
import { findExistingFeatureSlugs } from "@/repositories/feature-repository";
import { buildAdminPropertyWhere } from "@/services/admin-property-query";
import { validatePropertyInput } from "@/services/admin-property-validation";
import { toAdminProperty } from "@/services/admin-property-mapper";

/**
 * CRUD de propiedades (spec.md, sección 19).
 *
 * Quién puede llamar a esto lo decide la guarda del Route Handler. Aquí solo
 * viven las reglas: qué es una propiedad válida y qué significa cada
 * operación.
 */

export type PropertyMutationOutcome =
  | { readonly status: "ok"; readonly property: AdminPropertyDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "not-found" };

export async function listAdminProperties(
  query: AdminPropertyListQuery = {},
): Promise<AdminPropertyPageDto> {
  const page = normalizePage(query.page);

  const { properties, total } = await findAdminProperties({
    filters: buildAdminPropertyWhere(query),
    skip: (page - 1) * ADMIN_PROPERTIES_PER_PAGE,
    take: ADMIN_PROPERTIES_PER_PAGE,
  });

  return {
    data: properties.map(toAdminProperty),
    total,
    page,
    pageSize: ADMIN_PROPERTIES_PER_PAGE,
  };
}

export async function getAdminProperty(
  id: string,
): Promise<AdminPropertyDto | null> {
  const property = await findAdminPropertyById(id);

  return property ? toAdminProperty(property) : null;
}

export async function createAdminProperty(
  payload: unknown,
): Promise<PropertyMutationOutcome> {
  const validation = validatePropertyInput(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const unknownFeatures = await describeUnknownFeatures(validation.property);

  if (unknownFeatures) {
    return { status: "invalid", message: unknownFeatures };
  }

  return {
    status: "ok",
    property: toAdminProperty(await createProperty(validation.property)),
  };
}

export async function updateAdminProperty(
  id: string,
  payload: unknown,
): Promise<PropertyMutationOutcome> {
  const validation = validatePropertyInput(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const unknownFeatures = await describeUnknownFeatures(validation.property);

  if (unknownFeatures) {
    return { status: "invalid", message: unknownFeatures };
  }

  // Se comprueba antes de escribir para poder responder 404 en lugar de
  // dejar que falle la actualización con un error del ORM. De paso trae la
  // fecha de publicación vigente, que decide si hay que sellarla.
  const current = await findAdminPropertyById(id);

  if (!current) {
    return { status: "not-found" };
  }

  return {
    status: "ok",
    property: toAdminProperty(
      await updateProperty(id, validation.property, current.publishedAt),
    ),
  };
}

export type PropertyDeletionOutcome =
  { readonly status: "deleted" } | { readonly status: "not-found" };

/**
 * Elimina una propiedad, lógicamente (spec.md, sección 19).
 *
 * Deja de existir para todo el mundo, pero sus consultas y los favoritos
 * ajenos sobreviven. Para retirarla del catálogo conservándola a la vista de
 * la administración está despublicarla.
 */
export async function deleteAdminProperty(
  id: string,
): Promise<PropertyDeletionOutcome> {
  if (!(await findAdminPropertyById(id))) {
    return { status: "not-found" };
  }

  await markPropertyAsDeleted(id);

  return { status: "deleted" };
}

/**
 * Mensaje de error si alguna característica no existe, o `null` si todas sí.
 *
 * Conectar por `slug` uno que no está en la tabla hace lanzar al ORM, y eso
 * llegaría como un 500 mudo. Comprobarlo aquí lo convierte en un 400 que
 * dice cuál sobra.
 */
async function describeUnknownFeatures(
  property: PropertyInputDto,
): Promise<string | null> {
  const slugs = property.featureSlugs ?? [];

  if (slugs.length === 0) {
    return null;
  }

  const existing = new Set(await findExistingFeatureSlugs(slugs));
  const unknown = slugs.filter((slug) => !existing.has(slug));

  if (unknown.length === 0) {
    return null;
  }

  return `Estas características no existen: ${unknown.join(", ")}.`;
}

/** Una página fuera de rango se trata como la primera. */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}
