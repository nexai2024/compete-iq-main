-- CreateEnum
CREATE TYPE "AnalysisStatus" AS ENUM ('processing', 'completed', 'failed');

-- CreateEnum
CREATE TYPE "CompetitorType" AS ENUM ('direct', 'indirect');

-- CreateEnum
CREATE TYPE "MVPPriority" AS ENUM ('P0', 'P1', 'P2');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('user_app', 'competitor');

-- CreateEnum
CREATE TYPE "GapType" AS ENUM ('deficit', 'standout');

-- CreateEnum
CREATE TYPE "GapSeverity" AS ENUM ('critical', 'high', 'medium', 'low');

-- CreateEnum
CREATE TYPE "OpportunityLevel" AS ENUM ('low', 'medium', 'high', 'very_high');

-- CreateEnum
CREATE TYPE "DifficultyLevel" AS ENUM ('easy', 'moderate', 'hard', 'very_hard');

-- CreateEnum
CREATE TYPE "PersonaType" AS ENUM ('price_sensitive', 'power_user', 'corporate_buyer');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('user', 'assistant');

-- CreateEnum
CREATE TYPE "ReviewSentiment" AS ENUM ('positive', 'mixed', 'negative');

-- CreateTable
CREATE TABLE "analyses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "target_audience" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "AnalysisStatus" NOT NULL DEFAULT 'processing',
    "ai_processing_stage" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_features" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "feature_description" TEXT,
    "mvp_priority" "MVPPriority",
    "priority_reasoning" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitors" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "CompetitorType" NOT NULL,
    "description" TEXT,
    "website_url" TEXT,
    "logo_url" TEXT,
    "market_position" TEXT,
    "founded_year" INTEGER,
    "pricing_model" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "competitor_features" (
    "id" TEXT NOT NULL,
    "competitor_id" TEXT NOT NULL,
    "feature_name" TEXT NOT NULL,
    "feature_description" TEXT,
    "feature_category" TEXT,
    "is_paid" BOOLEAN,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "competitor_features_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comparison_parameters" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "parameter_name" TEXT NOT NULL,
    "parameter_description" TEXT,
    "weight" DOUBLE PRECISION,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comparison_parameters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feature_matrix_scores" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "parameter_id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT,
    "score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "feature_matrix_scores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gap_analysis_items" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "type" "GapType" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected_competitors" JSONB,
    "severity" "GapSeverity",
    "opportunity_score" DOUBLE PRECISION,
    "recommendation" TEXT,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gap_analysis_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blue_ocean_insight" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "market_vacuum_title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "supporting_evidence" JSONB,
    "target_segment" TEXT,
    "estimated_opportunity" "OpportunityLevel" NOT NULL,
    "implementation_difficulty" "DifficultyLevel" NOT NULL,
    "strategic_recommendation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blue_ocean_insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personas" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "persona_type" "PersonaType" NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT NOT NULL,
    "pain_points" JSONB,
    "priorities" JSONB,
    "behavior_profile" TEXT,
    "system_prompt" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "personas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persona_chat_messages" (
    "id" TEXT NOT NULL,
    "persona_id" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "message" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "persona_chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "positioning_data" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" TEXT,
    "entity_name" TEXT NOT NULL,
    "value_score" DOUBLE PRECISION NOT NULL,
    "complexity_score" DOUBLE PRECISION NOT NULL,
    "reasoning" TEXT,
    "quadrant" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "positioning_data_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_reviews" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "reviewer_name" TEXT NOT NULL,
    "reviewer_profile" TEXT,
    "rating" INTEGER NOT NULL,
    "review_text" TEXT NOT NULL,
    "sentiment" "ReviewSentiment" NOT NULL,
    "highlighted_features" JSONB,
    "pain_points_addressed" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulated_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "analyses_user_id_idx" ON "analyses"("user_id");

-- CreateIndex
CREATE INDEX "analyses_status_idx" ON "analyses"("status");

-- CreateIndex
CREATE INDEX "analyses_created_at_idx" ON "analyses"("created_at" DESC);

-- CreateIndex
CREATE INDEX "user_features_analysis_id_idx" ON "user_features"("analysis_id");

-- CreateIndex
CREATE INDEX "user_features_mvp_priority_idx" ON "user_features"("mvp_priority");

-- CreateIndex
CREATE INDEX "competitors_analysis_id_idx" ON "competitors"("analysis_id");

-- CreateIndex
CREATE INDEX "competitors_type_idx" ON "competitors"("type");

-- CreateIndex
CREATE INDEX "competitor_features_competitor_id_idx" ON "competitor_features"("competitor_id");

-- CreateIndex
CREATE INDEX "comparison_parameters_analysis_id_idx" ON "comparison_parameters"("analysis_id");

-- CreateIndex
CREATE INDEX "comparison_parameters_order_index_idx" ON "comparison_parameters"("order_index");

-- CreateIndex
CREATE UNIQUE INDEX "comparison_parameters_analysis_id_parameter_name_key" ON "comparison_parameters"("analysis_id", "parameter_name");

-- CreateIndex
CREATE INDEX "feature_matrix_scores_analysis_id_idx" ON "feature_matrix_scores"("analysis_id");

-- CreateIndex
CREATE INDEX "feature_matrix_scores_parameter_id_idx" ON "feature_matrix_scores"("parameter_id");

-- CreateIndex
CREATE INDEX "feature_matrix_scores_entity_id_idx" ON "feature_matrix_scores"("entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "feature_matrix_scores_parameter_id_entity_type_entity_id_key" ON "feature_matrix_scores"("parameter_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "gap_analysis_items_analysis_id_idx" ON "gap_analysis_items"("analysis_id");

-- CreateIndex
CREATE INDEX "gap_analysis_items_type_idx" ON "gap_analysis_items"("type");

-- CreateIndex
CREATE INDEX "gap_analysis_items_severity_idx" ON "gap_analysis_items"("severity");

-- CreateIndex
CREATE UNIQUE INDEX "blue_ocean_insight_analysis_id_key" ON "blue_ocean_insight"("analysis_id");

-- CreateIndex
CREATE INDEX "blue_ocean_insight_analysis_id_idx" ON "blue_ocean_insight"("analysis_id");

-- CreateIndex
CREATE INDEX "personas_analysis_id_idx" ON "personas"("analysis_id");

-- CreateIndex
CREATE INDEX "personas_persona_type_idx" ON "personas"("persona_type");

-- CreateIndex
CREATE UNIQUE INDEX "personas_analysis_id_persona_type_key" ON "personas"("analysis_id", "persona_type");

-- CreateIndex
CREATE INDEX "persona_chat_messages_persona_id_idx" ON "persona_chat_messages"("persona_id");

-- CreateIndex
CREATE INDEX "persona_chat_messages_created_at_idx" ON "persona_chat_messages"("created_at");

-- CreateIndex
CREATE INDEX "positioning_data_analysis_id_idx" ON "positioning_data"("analysis_id");

-- CreateIndex
CREATE UNIQUE INDEX "positioning_data_analysis_id_entity_type_entity_id_key" ON "positioning_data"("analysis_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "simulated_reviews_analysis_id_idx" ON "simulated_reviews"("analysis_id");

-- CreateIndex
CREATE INDEX "simulated_reviews_rating_idx" ON "simulated_reviews"("rating");

-- CreateIndex
CREATE INDEX "simulated_reviews_sentiment_idx" ON "simulated_reviews"("sentiment");

-- AddForeignKey
ALTER TABLE "user_features" ADD CONSTRAINT "user_features_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitors" ADD CONSTRAINT "competitors_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "competitor_features" ADD CONSTRAINT "competitor_features_competitor_id_fkey" FOREIGN KEY ("competitor_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comparison_parameters" ADD CONSTRAINT "comparison_parameters_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_matrix_scores" ADD CONSTRAINT "feature_matrix_scores_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_matrix_scores" ADD CONSTRAINT "feature_matrix_scores_parameter_id_fkey" FOREIGN KEY ("parameter_id") REFERENCES "comparison_parameters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feature_matrix_scores" ADD CONSTRAINT "feature_matrix_scores_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gap_analysis_items" ADD CONSTRAINT "gap_analysis_items_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blue_ocean_insight" ADD CONSTRAINT "blue_ocean_insight_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personas" ADD CONSTRAINT "personas_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "persona_chat_messages" ADD CONSTRAINT "persona_chat_messages_persona_id_fkey" FOREIGN KEY ("persona_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positioning_data" ADD CONSTRAINT "positioning_data_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "positioning_data" ADD CONSTRAINT "positioning_data_entity_id_fkey" FOREIGN KEY ("entity_id") REFERENCES "competitors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulated_reviews" ADD CONSTRAINT "simulated_reviews_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
