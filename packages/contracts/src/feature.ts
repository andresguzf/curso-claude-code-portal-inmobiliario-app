import type { PropertyFeatureDto } from "./property";

/**
 * Catálogo de características disponibles (spec.md, sección 19).
 *
 * El formulario de propiedad las ofrece como opciones: nadie escribe una
 * característica a mano, porque el backend conecta por `slug` y un `slug`
 * inventado no existiría en la tabla.
 *
 * Crear características nuevas llega en el paso 28.
 */
export type FeatureListDto = {
  readonly data: readonly PropertyFeatureDto[];
};
