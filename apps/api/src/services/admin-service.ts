import "server-only";

import type { AdminOverviewDto } from "@portal/contracts";

import { countOverview } from "@/repositories/admin-repository";

/**
 * Panel de administración (spec.md, sección 18).
 *
 * Quién puede verlo no se decide aquí, sino en la guarda del Route Handler:
 * esta capa se ocupa de qué se muestra, no de a quién.
 */
export function getAdminOverview(): Promise<AdminOverviewDto> {
  return countOverview();
}
