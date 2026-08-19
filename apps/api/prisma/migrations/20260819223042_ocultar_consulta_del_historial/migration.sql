-- DropIndex
DROP INDEX "inquiries_user_id_idx";

-- AlterTable
ALTER TABLE "inquiries" ADD COLUMN     "hidden_by_user_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "inquiries_user_id_hidden_by_user_at_created_at_idx" ON "inquiries"("user_id", "hidden_by_user_at", "created_at");
