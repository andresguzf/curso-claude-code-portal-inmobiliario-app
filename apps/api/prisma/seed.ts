import { PrismaPg } from "@prisma/adapter-pg";

import { buildSearchText, normalizeSearchText } from "@portal/contracts";

import { PrismaClient } from "../src/generated/prisma/client";
import { hashPassword } from "../src/lib/password";
import {
  SEED_FEATURES,
  SEED_PROPERTIES,
  SEED_USERS,
  buildSeedImages,
  type SeedProperty,
} from "./seed-data";

/**
 * Traduce una propiedad del seed a las columnas de la tabla `properties`.
 *
 * `id`, `featureSlugs` e `imageCount` quedan fuera a propósito: el primero
 * identifica la fila y los otros dos describen relaciones, no columnas.
 */
function toPropertyFields(property: SeedProperty, index: number) {
  return {
    title: property.title,
    description: property.description,
    operationType: property.operationType,
    propertyType: property.propertyType,
    price: property.price,
    usableAreaSquareMeters: property.usableAreaSquareMeters,
    totalAreaSquareMeters: property.totalAreaSquareMeters,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    parkingSpaces: property.parkingSpaces,
    ageYears: property.ageYears,
    address: property.address,
    commune: property.commune,
    city: property.city,
    region: property.region,
    isPublished: property.isPublished,
    isFeatured: property.isFeatured,
    publishedAt: toPublicationDate(property, index),
    searchText: buildSearchText(
      property.title,
      property.commune,
      property.city,
      property.region,
      property.address,
      property.description,
    ),
    communeNormalized: normalizeSearchText(property.commune),
    cityNormalized: normalizeSearchText(property.city),
    regionNormalized: normalizeSearchText(property.region),
  };
}

/**
 * Fecha de publicación de una propiedad del seed.
 *
 * Un borrador no tiene ninguna. Las publicadas se reparten una por semana
 * hacia atrás desde una fecha fija, para que el filtro por rango de fechas
 * tenga algo que filtrar en desarrollo.
 *
 * El ancla es fija y no `Date.now()`: el seed es idempotente, y una fecha
 * relativa al momento de ejecutarlo movería los datos en cada corrida.
 */
const PUBLICATION_ANCHOR = Date.parse("2026-08-01T12:00:00.000Z");
const ONE_WEEK_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

function toPublicationDate(property: SeedProperty, index: number): Date | null {
  if (!property.isPublished) {
    return null;
  }

  return new Date(PUBLICATION_ANCHOR - index * ONE_WEEK_IN_MILLISECONDS);
}

/**
 * Carga los datos de desarrollo.
 *
 * El seed es idempotente: usa identificadores fijos y `upsert`, de modo que
 * ejecutarlo varias veces actualiza las filas existentes en lugar de
 * duplicarlas, y no destruye datos ajenos al seed.
 */
async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("Falta la variable de entorno DATABASE_URL.");
  }

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    for (const user of SEED_USERS) {
      const passwordHash = await hashPassword(user.password);
      const fields = {
        name: user.name,
        role: user.role,
        isActive: user.isActive,
        passwordHash,
        // El seed escribe por su cuenta, sin pasar por el repositorio, así
        // que le toca mantener también la copia normalizada. Sin ella, la
        // cuenta existiría pero el buscador no la encontraría.
        searchText: buildSearchText(user.name, user.email),
      };

      await prisma.user.upsert({
        where: { email: user.email },
        create: { email: user.email, ...fields },
        update: fields,
      });
    }

    console.log(`Usuarios cargados: ${SEED_USERS.length}`);

    for (const feature of SEED_FEATURES) {
      await prisma.feature.upsert({
        where: { slug: feature.slug },
        create: { slug: feature.slug, name: feature.name },
        update: { name: feature.name },
      });
    }

    console.log(`Características cargadas: ${SEED_FEATURES.length}`);

    for (const [index, property] of SEED_PROPERTIES.entries()) {
      const { id } = property;
      const propertyFields = toPropertyFields(property, index);
      const featureConnections = property.featureSlugs.map((slug) => ({
        slug,
      }));

      await prisma.property.upsert({
        where: { id },
        create: {
          id,
          ...propertyFields,
          features: { connect: featureConnections },
        },
        update: {
          ...propertyFields,
          // `set` reemplaza las características anteriores, para que al
          // reejecutar el seed no queden asociaciones obsoletas.
          features: { set: featureConnections },
        },
      });

      // La galería solo se rellena si está vacía.
      //
      // Antes se borraba entera y se regeneraba, por ser «más simple». No era
      // más seguro: quien hubiera subido fotografías desde el panel las perdía
      // en la siguiente ejecución del seed, y los archivos quedaban huérfanos
      // en Cloudinary sin que nada los referenciara. Ocurrió de verdad, con
      // quince archivos.
      //
      // El seed siembra datos de partida; no es dueño de lo que se añada
      // después.
      const imagenesExistentes = await prisma.propertyImage.count({
        where: { propertyId: id },
      });

      if (imagenesExistentes === 0) {
        await prisma.propertyImage.createMany({
          data: buildSeedImages(property).map((image) => ({
            ...image,
            propertyId: id,
          })),
        });
      }
    }

    console.log(`Propiedades cargadas: ${SEED_PROPERTIES.length}`);

    // `deletedAt: null` también aquí: una propiedad eliminada no cuenta
    // como publicada, y sin esta condición el resumen del seed contaba las
    // que ya no existen para nadie.
    const publishedCount = await prisma.property.count({
      where: { isPublished: true, deletedAt: null },
    });
    const imageCount = await prisma.propertyImage.count();

    console.log(`Publicadas: ${publishedCount} · Imágenes: ${imageCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error("El seed falló:", error);
  process.exit(1);
});
