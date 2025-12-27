-- CreateTable
CREATE TABLE "market_intelligence" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "industry_overview" TEXT NOT NULL,
    "market_size" TEXT,
    "market_growth" TEXT,
    "market_trends" JSONB,
    "competitive_landscape" TEXT NOT NULL,
    "market_dynamics" JSONB,
    "barriers_to_entry" JSONB,
    "opportunities" JSONB,
    "threats" JSONB,
    "strategic_recommendations" TEXT NOT NULL,
    "key_success_factors" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "market_intelligence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "market_intelligence_analysis_id_key" ON "market_intelligence"("analysis_id");

-- CreateIndex
CREATE INDEX "market_intelligence_analysis_id_idx" ON "market_intelligence"("analysis_id");

-- AddForeignKey
ALTER TABLE "market_intelligence" ADD CONSTRAINT "market_intelligence_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
