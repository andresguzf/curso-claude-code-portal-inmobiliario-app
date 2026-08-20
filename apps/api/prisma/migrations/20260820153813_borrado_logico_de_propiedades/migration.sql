-- AlterTable
ALTER TABLE "properties" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "properties_deleted_at_is_published_created_at_idx" ON "properties"("deleted_at", "is_published", "created_at");
