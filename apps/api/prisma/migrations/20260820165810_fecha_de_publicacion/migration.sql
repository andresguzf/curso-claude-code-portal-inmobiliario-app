-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "published_at" TIMESTAMP(3);

-- Las propiedades que ya estaban publicadas se sellan con su fecha de alta.
-- No es el dato exacto —nadie lo guardó— pero es la mejor aproximación
-- disponible, y dejarlas en nulo las escondería de cualquier filtro por
-- fecha, que es peor que una fecha aproximada.
UPDATE "properties" SET "published_at" = "created_at" WHERE "is_published" = true;
