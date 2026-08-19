import { PrismaPg } from "@prisma/adapter-pg";

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
function toPropertyFields(property: SeedProperty) {
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
  };
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

    for (const property of SEED_PROPERTIES) {
      const { id } = property;
      const propertyFields = toPropertyFields(property);
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

      // Las imágenes se regeneran completas: es más simple y seguro que
      // reconciliar posiciones e imagen principal una a una.
      await prisma.propertyImage.deleteMany({ where: { propertyId: id } });
      await prisma.propertyImage.createMany({
        data: buildSeedImages(property).map((image) => ({
          ...image,
          propertyId: id,
        })),
      });
    }

    console.log(`Propiedades cargadas: ${SEED_PROPERTIES.length}`);

    const publishedCount = await prisma.property.count({
      where: { isPublished: true },
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
