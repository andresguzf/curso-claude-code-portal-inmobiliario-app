import "server-only";

import type { FeatureListDto } from "@portal/contracts";

import { findAllFeatures } from "@/repositories/feature-repository";

/** Características disponibles, en orden alfabético (spec.md, sección 19). */
export async function listFeatures(): Promise<FeatureListDto> {
  return { data: await findAllFeatures() };
}
