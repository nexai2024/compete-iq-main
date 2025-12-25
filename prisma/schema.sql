-- CompeteIQ Database Schema for PostgreSQL
-- Compatible with Vercel Postgres
-- This is a backup SQL script. Primary source is schema.prisma

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUMS
CREATE TYPE analysis_status AS ENUM ('processing', 'completed', 'failed');
CREATE TYPE competitor_type AS ENUM ('direct', 'indirect');
CREATE TYPE mvp_priority AS ENUM ('P0', 'P1', 'P2');
CREATE TYPE entity_type AS ENUM ('user_app', 'competitor');
CREATE TYPE gap_type AS ENUM ('deficit', 'standout');
CREATE TYPE gap_severity AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE opportunity_level AS ENUM ('low', 'medium', 'high', 'very_high');
CREATE TYPE difficulty_level AS ENUM ('easy', 'moderate', 'hard', 'very_hard');
CREATE TYPE persona_type AS ENUM ('price_sensitive', 'power_user', 'corporate_buyer');
CREATE TYPE message_role AS ENUM ('user', 'assistant');
CREATE TYPE review_sentiment AS ENUM ('positive', 'mixed', 'negative');

-- TABLE: analyses
CREATE TABLE analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    app_name VARCHAR(255) NOT NULL,
    target_audience TEXT NOT NULL,
    description TEXT NOT NULL,
    status analysis_status NOT NULL DEFAULT 'processing',
    ai_processing_stage VARCHAR(100),
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analyses_user_id ON analyses(user_id);
CREATE INDEX idx_analyses_status ON analyses(status);
CREATE INDEX idx_analyses_created_at ON analyses(created_at DESC);

-- TABLE: user_features
CREATE TABLE user_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    mvp_priority mvp_priority,
    priority_reasoning TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_user_features_analysis_id ON user_features(analysis_id);
CREATE INDEX idx_user_features_mvp_priority ON user_features(mvp_priority);

-- TABLE: competitors
CREATE TABLE competitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type competitor_type NOT NULL,
    description TEXT,
    website_url VARCHAR(500),
    logo_url VARCHAR(500),
    market_position TEXT,
    founded_year INTEGER,
    pricing_model VARCHAR(100),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitors_analysis_id ON competitors(analysis_id);
CREATE INDEX idx_competitors_type ON competitors(type);

-- TABLE: competitor_features
CREATE TABLE competitor_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
    feature_name VARCHAR(255) NOT NULL,
    feature_description TEXT,
    feature_category VARCHAR(100),
    is_paid BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_competitor_features_competitor_id ON competitor_features(competitor_id);

-- TABLE: comparison_parameters
CREATE TABLE comparison_parameters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    parameter_name VARCHAR(255) NOT NULL,
    parameter_description TEXT,
    weight DECIMAL(3, 2),
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(analysis_id, parameter_name)
);

CREATE INDEX idx_comparison_parameters_analysis_id ON comparison_parameters(analysis_id);
CREATE INDEX idx_comparison_parameters_order_index ON comparison_parameters(order_index);

-- TABLE: feature_matrix_scores
CREATE TABLE feature_matrix_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    parameter_id UUID NOT NULL REFERENCES comparison_parameters(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID,
    score DECIMAL(5, 2) NOT NULL,
    reasoning TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parameter_id, entity_type, entity_id)
);

CREATE INDEX idx_feature_matrix_scores_analysis_id ON feature_matrix_scores(analysis_id);
CREATE INDEX idx_feature_matrix_scores_parameter_id ON feature_matrix_scores(parameter_id);
CREATE INDEX idx_feature_matrix_scores_entity_id ON feature_matrix_scores(entity_id);

ALTER TABLE feature_matrix_scores
    ADD CONSTRAINT fk_feature_matrix_scores_competitor
    FOREIGN KEY (entity_id) REFERENCES competitors(id) ON DELETE CASCADE;

-- TABLE: gap_analysis_items
CREATE TABLE gap_analysis_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    type gap_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    affected_competitors JSONB,
    severity gap_severity,
    opportunity_score DECIMAL(3, 1),
    recommendation TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gap_analysis_items_analysis_id ON gap_analysis_items(analysis_id);
CREATE INDEX idx_gap_analysis_items_type ON gap_analysis_items(type);
CREATE INDEX idx_gap_analysis_items_severity ON gap_analysis_items(severity);

-- TABLE: blue_ocean_insight
CREATE TABLE blue_ocean_insight (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL UNIQUE REFERENCES analyses(id) ON DELETE CASCADE,
    market_vacuum_title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    supporting_evidence JSONB,
    target_segment VARCHAR(255),
    estimated_opportunity opportunity_level NOT NULL,
    implementation_difficulty difficulty_level NOT NULL,
    strategic_recommendation TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_blue_ocean_insight_analysis_id ON blue_ocean_insight(analysis_id);

-- TABLE: personas
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    persona_type persona_type NOT NULL,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    description TEXT NOT NULL,
    pain_points JSONB,
    priorities JSONB,
    behavior_profile TEXT,
    system_prompt TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(analysis_id, persona_type)
);

CREATE INDEX idx_personas_analysis_id ON personas(analysis_id);
CREATE INDEX idx_personas_persona_type ON personas(persona_type);

-- TABLE: persona_chat_messages
CREATE TABLE persona_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_persona_chat_messages_persona_id ON persona_chat_messages(persona_id);
CREATE INDEX idx_persona_chat_messages_created_at ON persona_chat_messages(created_at);

-- TABLE: positioning_data
CREATE TABLE positioning_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    entity_type entity_type NOT NULL,
    entity_id UUID,
    entity_name VARCHAR(255) NOT NULL,
    value_score DECIMAL(4, 2) NOT NULL,
    complexity_score DECIMAL(4, 2) NOT NULL,
    reasoning TEXT,
    quadrant VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(analysis_id, entity_type, entity_id)
);

CREATE INDEX idx_positioning_data_analysis_id ON positioning_data(analysis_id);

ALTER TABLE positioning_data
    ADD CONSTRAINT fk_positioning_data_competitor
    FOREIGN KEY (entity_id) REFERENCES competitors(id) ON DELETE CASCADE;

-- TABLE: simulated_reviews
CREATE TABLE simulated_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL REFERENCES analyses(id) ON DELETE CASCADE,
    reviewer_name VARCHAR(255) NOT NULL,
    reviewer_profile VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT NOT NULL,
    sentiment review_sentiment NOT NULL,
    highlighted_features JSONB,
    pain_points_addressed JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_simulated_reviews_analysis_id ON simulated_reviews(analysis_id);
CREATE INDEX idx_simulated_reviews_rating ON simulated_reviews(rating);
CREATE INDEX idx_simulated_reviews_sentiment ON simulated_reviews(sentiment);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_analyses_updated_at BEFORE UPDATE ON analyses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
