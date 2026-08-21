import "server-only";

import type { AdminFeatureDto, FeatureListDto } from "@portal/contracts";

import {
  createFeature,
  deleteFeature,
  findAllFeatures,
  findFeatureById,
  findFeatureByNameOrSlug,
  renameFeature,
} from "@/repositories/feature-repository";
import { validateFeatureInput } from "@/services/feature-validation";

/**
 * Alta, cambio de nombre y baja de características (spec.md, sección 4).
 *
 * Añadir una característica nueva es dar de alta una fila, nunca una columna
 * en `Property` ni un despliegue.
 */

type FeatureRecord = {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly _count: { readonly properties: number };
};

export type FeatureMutationOutcome =
  | { readonly status: "ok"; readonly feature: AdminFeatureDto }
  | { readonly status: "invalid"; readonly message: string }
  | { readonly status: "duplicate"; readonly message: string }
  | { readonly status: "not-found" };

export type FeatureDeletionOutcome =
  { readonly status: "deleted" } | { readonly status: "not-found" };

/** Características disponibles, en orden alfabético. */
export async function listFeatures(): Promise<FeatureListDto> {
  return { data: (await findAllFeatures()).map(toAdminFeature) };
}

export async function addFeature(
  payload: unknown,
): Promise<FeatureMutationOutcome> {
  const validation = validateFeatureInput(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  // Se comprueba antes de escribir para responder un 409 explicando cuál
  // choca, en vez de dejar reventar la restricción de unicidad con un 500.
  const existing = await findFeatureByNameOrSlug(
    validation.name,
    validation.slug,
  );

  if (existing) {
    return {
      status: "duplicate",
      message: `«${existing.name}» ya existe.`,
    };
  }

  return {
    status: "ok",
    feature: toAdminFeature(
      await createFeature({ name: validation.name, slug: validation.slug }),
    ),
  };
}

/**
 * Cambia el nombre visible, no el identificador.
 *
 * El `slug` se queda como estaba: es con lo que las propiedades se conectan,
 * y corregir una errata en el nombre no debería romper esas referencias.
 */
export async function changeFeatureName(
  id: string,
  payload: unknown,
): Promise<FeatureMutationOutcome> {
  const validation = validateFeatureInput(payload);

  if (!validation.ok) {
    return { status: "invalid", message: validation.message };
  }

  const current = await findFeatureById(id);

  if (!current) {
    return { status: "not-found" };
  }

  const existing = await findFeatureByNameOrSlug(
    validation.name,
    validation.slug,
  );

  // Que choque consigo misma no es un choque: renombrar «Piscina» a
  // «piscina» debe poder hacerse.
  if (existing && existing.id !== id) {
    return { status: "duplicate", message: `«${existing.name}» ya existe.` };
  }

  return {
    status: "ok",
    feature: toAdminFeature(await renameFeature(id, validation.name)),
  };
}

/**
 * Elimina una característica.
 *
 * Las propiedades que la declaraban dejan de hacerlo. No pierden ningún otro
 * dato, y la interfaz avisa de a cuántas afecta antes de confirmar.
 */
export async function removeFeature(
  id: string,
): Promise<FeatureDeletionOutcome> {
  if (!(await findFeatureById(id))) {
    return { status: "not-found" };
  }

  await deleteFeature(id);

  return { status: "deleted" };
}

function toAdminFeature(feature: FeatureRecord): AdminFeatureDto {
  return {
    id: feature.id,
    name: feature.name,
    slug: feature.slug,
    propertyCount: feature._count.properties,
  };
}
