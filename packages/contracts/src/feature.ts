import type { PropertyFeatureDto } from "./property";

/**
 * Características del inmueble (spec.md, sección 4).
 *
 * Se modelan como filas de una tabla y no como columnas booleanas de
 * `Property`: añadir «piscina temperada» debe ser dar de alta un registro, no
 * una migración.
 *
 * El formulario de propiedad las ofrece como opciones porque el backend las
 * conecta por `slug`: una escrita a mano no existiría.
 */

/**
 * Una característica con cuántas propiedades la usan.
 *
 * El recuento no es decorativo: es lo que permite decir, antes de eliminarla,
 * a cuántas fichas va a afectar.
 */
export type AdminFeatureDto = PropertyFeatureDto & {
  readonly propertyCount: number;
};

export type FeatureListDto = {
  readonly data: readonly AdminFeatureDto[];
};

/**
 * Datos que ADMIN envía al crear o renombrar.
 *
 * No lleva `slug`: lo deriva el servidor del nombre. Es el identificador
 * estable del registro, y dejarlo escribir invitaría a inventar uno que no
 * case con el resto.
 */
export type FeatureInputDto = {
  readonly name: string;
};

export const FEATURE_LIMITS = {
  maxNameLength: 60,
} as const;
