import "server-only";

import {
  ADMIN_PROPERTIES_PER_PAGE,
  type AdminPropertyDto,
  type AdminPropertyPageDto,
} from "@portal/contracts";

import {
  createProperty,
  markPropertyAsDeleted,
  findAdminProperties,
  findAdminPropertyById,
  updateProperty,
} from "@/repositories/admin-property-repository";
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
  options: { readonly search?: string; readonly page?: number } = {},
): Promise<AdminPropertyPageDto> {
  const page = normalizePage(options.page);
  const search = (options.search ?? "").trim();

  const { properties, total } = await findAdminProperties({
    search,
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

  // Se comprueba antes de escribir para poder responder 404 en lugar de
  // dejar que falle la actualización con un error del ORM.
  if (!(await findAdminPropertyById(id))) {
    return { status: "not-found" };
  }

  return {
    status: "ok",
    property: toAdminProperty(await updateProperty(id, validation.property)),
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

/** Una página fuera de rango se trata como la primera. */
function normalizePage(page: number | undefined): number {
  return Number.isInteger(page) && (page as number) > 0 ? (page as number) : 1;
}
