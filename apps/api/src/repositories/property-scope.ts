import "server-only";

/**
 * Alcance de las consultas sobre propiedades.
 *
 * Una propiedad eliminada no existe para nadie: ni para el catálogo, ni para
 * la administración, ni para las listas de favoritos o consultas. Solo la
 * conserva la base de datos, para no destruir los registros que arrastra
 * (spec.md, sección 19).
 *
 * Vive en un solo sitio a propósito. Repartir `deletedAt: null` por cada
 * consulta es exactamente el tipo de condición que se olvida en la siguiente
 * que alguien escriba, y el olvido no se nota: la propiedad reaparece.
 */
export const NOT_DELETED = { deletedAt: null } as const;

/** Lo que puede ver quien no administra. */
export const PUBLIC_PROPERTY_SCOPE = {
  isPublished: true,
  ...NOT_DELETED,
} as const;
