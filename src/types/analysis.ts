// Domain-specific types for analysis processing

export interface CompetitorSearchResult {
  name: string;
  type: 'direct' | 'indirect';
  description: string;
  website_url?: string;
  market_position?: string;
  pricing_model?: string;
  founded_year?: number;
}

export interface CompetitorEnrichmentResult {
  founded_year?: number | null;
  market_position?: string;
  features: {
    name: string;
    description: string;
    category: 'Core' | 'Premium' | 'Integration' | 'Mobile';
    is_paid: boolean | null;
  }[];
}

export interface ComparisonParameterData {
  name: string;
  description: string;
  weight: number;
}

export interface FeatureScoreData {
  score: number;
  reasoning: string;
}

export interface DeficitData {
  title: string;
  description: string;
  affected_competitors: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  recommendation: string;
}

export interface StandoutData {
  title: string;
  description: string;
  opportunity_score: number;
  recommendation: string;
}

export interface BlueOceanData {
  market_vacuum_title: string;
  description: string;
  supporting_evidence: string[];
  target_segment: string;
  estimated_opportunity: 'low' | 'medium' | 'high' | 'very_high';
  implementation_difficulty: 'easy' | 'moderate' | 'hard' | 'very_hard';
  strategic_recommendation: string;
}

export interface MVPPriorityData {
  feature_id: string;
  priority: 'P0' | 'P1' | 'P2';
  reasoning: string;
}

export interface PersonaData {
  persona_type: 'price_sensitive' | 'power_user' | 'corporate_buyer';
  name: string;
  title: string;
  description: string;
  pain_points: string[];
  priorities: string[];
  behavior_profile: string;
  system_prompt: string;
}

export interface SimulatedReviewData {
  reviewer_name: string;
  reviewer_profile: string;
  rating: number;
  review_text: string;
  sentiment: 'positive' | 'mixed' | 'negative';
  highlighted_features: string[];
  pain_points_addressed: string[];
}

export interface PositioningMapDataPoint {
  entity_type: 'user_app' | 'competitor';
  entity_id: string | null;
  entity_name: string;
  value_score: number;
  complexity_score: number;
  reasoning: string;
}

// Processing stage types
export type ProcessingStage =
  | 'competitors'
  | 'competitors_complete'
  | 'features'
  | 'matrix_progress_10/70'
  | 'matrix_progress_20/70'
  | 'matrix_progress_30/70'
  | 'matrix_progress_40/70'
  | 'matrix_progress_50/70'
  | 'matrix_progress_60/70'
  | 'matrix_complete'
  | 'gaps'
  | 'gaps_complete'
  | 'mvp'
  | 'mvp_complete'
  | 'personas'
  | 'personas_complete'
  | 'positioning'
  | 'positioning_complete'
  | 'finalizing'
  | 'complete';
