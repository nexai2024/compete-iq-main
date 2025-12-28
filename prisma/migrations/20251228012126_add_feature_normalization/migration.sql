-- AlterTable
ALTER TABLE "competitor_features" ADD COLUMN     "normalized_group_id" TEXT;

-- AlterTable
ALTER TABLE "user_features" ADD COLUMN     "normalized_group_id" TEXT;

-- CreateTable
CREATE TABLE "normalized_feature_groups" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "normalized_feature_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "normalized_feature_groups_analysis_id_idx" ON "normalized_feature_groups"("analysis_id");

-- CreateIndex
CREATE UNIQUE INDEX "normalized_feature_groups_analysis_id_canonical_name_key" ON "normalized_feature_groups"("analysis_id", "canonical_name");

-- CreateIndex
CREATE INDEX "competitor_features_normalized_group_id_idx" ON "competitor_features"("normalized_group_id");

-- CreateIndex
CREATE INDEX "user_features_normalized_group_id_idx" ON "user_features"("normalized_group_id");

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_normalized_group_id_fkey" FOREIGN KEY ("normalized_group_id") REFERENCES "normalized_feature_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_features" ADD CONSTRAINT "competitor_features_normalized_group_id_fkey" FOREIGN KEY ("normalized_group_id") REFERENCES "normalized_feature_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "normalized_feature_groups" ADD CONSTRAINT "normalized_feature_groups_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
