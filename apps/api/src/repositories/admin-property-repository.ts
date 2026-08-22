import "server-only";

import {
  buildSearchText,
  normalizeSearchText,
  type PropertyInputDto,
} from "@portal/contracts";

import { prisma } from "@/lib/prisma";
import { NOT_DELETED } from "@/repositories/property-scope";

/**
 * Acceso a `properties` desde la administración.
 *
 * A diferencia del repositorio público, aquí no hay filtro por
 * `isPublished`: quien administra ve también los borradores. Que solo llegue
 * ADMIN lo garantiza la guarda del Route Handler.
 */

/**
 * Columnas que necesita la administración.
 *
 * Aquí sí hacen falta la descripción y las características —el listado
 * comparte DTO con la ficha de edición—, pero no las copias normalizadas
 * para búsqueda, que duplican todo lo anterior y no se muestran en ninguna
 * parte.
 */
const adminSelection = {
  id: true,
  title: true,
  description: true,
  operationType: true,
  propertyType: true,
  price: true,
  currency: true,
  usableAreaSquareMeters: true,
  totalAreaSquareMeters: true,
  bedrooms: true,
  bathrooms: true,
  parkingSpaces: true,
  ageYears: true,
  address: true,
  commune: true,
  city: true,
  region: true,
  isPublished: true,
  isFeatured: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
  images: { orderBy: { position: "asc" } },
  features: true,
} as const;

export async function findAdminProperties(options: {
  /** Condiciones ya traducidas por `admin-property-query.ts`. */
  readonly filters: Record<string, unknown>;
  readonly skip: number;
  readonly take: number;
}) {
  const where = { ...NOT_DELETED, ...options.filters };

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      select: adminSelection,
      orderBy: { createdAt: "desc" },
      skip: options.skip,
      take: options.take,
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, total };
}

export function findAdminPropertyById(id: string) {
  // `findFirst` y no `findUnique`: hay que poder filtrar por eliminación,
  // y una propiedad eliminada debe responder como inexistente.
  return prisma.property.findFirst({
    where: { id, ...NOT_DELETED },
    select: adminSelection,
  });
}

/**
 * Crea una propiedad.
 *
 * Si nace publicada, la fecha de publicación se sella aquí: es una
 * consecuencia de publicar, no un campo del formulario (spec.md, sección 3).
 */
export function createProperty(input: PropertyInputDto) {
  return prisma.property.create({
    data: {
      ...toColumns(input),
      publishedAt: input.isPublished ? new Date() : null,
      features: { connect: toFeatureConnections(input) },
    },
    select: adminSelection,
  });
}

/**
 * Actualiza una propiedad completa.
 *
 * `set` reemplaza las características en vez de añadirlas: quien envía el
 * formulario manda la lista definitiva, y sin esto quitar una no tendría
 * ningún efecto.
 *
 * La fecha de publicación es la excepción: no viene del formulario. Se sella
 * la primera vez que la propiedad se publica y no se toca después, ni
 * siquiera al despublicarla, porque registra que salió al portal ese día
 * (spec.md, sección 3).
 */
export function updateProperty(
  id: string,
  input: PropertyInputDto,
  currentPublishedAt: Date | null,
) {
  return prisma.property.update({
    where: { id },
    data: {
      ...toColumns(input),
      ...(input.isPublished && currentPublishedAt === null
        ? { publishedAt: new Date() }
        : {}),
      features: { set: toFeatureConnections(input) },
    },
    select: adminSelection,
  });
}

/**
 * Elimina una propiedad, lógicamente.
 *
 * La fila se conserva para no destruir las consultas que arrastra, que son
 * contactos comerciales, ni los favoritos de otras personas. A partir de
 * aquí la propiedad no aparece en ninguna consulta de la aplicación.
 */
export function markPropertyAsDeleted(id: string) {
  return prisma.property.update({
    where: { id },
    data: { deletedAt: new Date() },
    select: { id: true },
  });
}

function toColumns(input: PropertyInputDto) {
  return {
    title: input.title,
    description: input.description,
    operationType: input.operationType,
    propertyType: input.propertyType,
    price: input.price,
    usableAreaSquareMeters: input.usableAreaSquareMeters ?? null,
    totalAreaSquareMeters: input.totalAreaSquareMeters ?? null,
    bedrooms: input.bedrooms ?? null,
    bathrooms: input.bathrooms ?? null,
    parkingSpaces: input.parkingSpaces ?? null,
    ageYears: input.ageYears ?? null,
    address: input.address,
    commune: input.commune,
    city: input.city,
    region: input.region,
    isPublished: input.isPublished ?? false,
    isFeatured: input.isFeatured ?? false,
    ...toSearchColumns(input),
  };
}

/**
 * Copias normalizadas de los campos por los que se busca.
 *
 * Se escriben aquí, junto a las columnas de las que derivan, para que no haya
 * forma de guardar una propiedad sin actualizarlas: es lo que se olvidaría si
 * viviesen en otro sitio (spec.md, sección 9).
 */
function toSearchColumns(input: PropertyInputDto) {
  return {
    searchText: buildSearchText(
      input.title,
      input.commune,
      input.city,
      input.region,
      input.address,
      input.description,
    ),
    communeNormalized: normalizeSearchText(input.commune),
    cityNormalized: normalizeSearchText(input.city),
    regionNormalized: normalizeSearchText(input.region),
  };
}

/**
 * Las características van aparte de las columnas porque crear y actualizar
 * las tratan distinto: `connect` al crear, `set` al actualizar.
 */
function toFeatureConnections(input: PropertyInputDto) {
  return (input.featureSlugs ?? []).map((slug) => ({ slug }));
}
