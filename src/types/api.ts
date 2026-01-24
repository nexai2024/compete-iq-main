import type {
  AnalysisStatus,
  Competitor,
  CompetitorType,
  UserFeature,
  GapAnalysisItem,
  BlueOceanInsight,
  Persona,
  PersonaChatMessage,
  PositioningData,
  SimulatedReview,
  ComparisonParameter,
  FeatureMatrixScore,
  MarketIntelligence,
} from './database';

// API Request Types

export interface CreateAnalysisRequest {
  appName: string;
  targetAudience: string;
  description: string;
  features: {
    name: string;
    description?: string;
  }[];
}

export interface CreateAnalysisResponse {
  analysisId: string;
  status: AnalysisStatus;
}

export interface SendPersonaMessageRequest {
  message: string;
}

// API Response Types

export interface OverviewData {
  analysis: {
    id: string;
    appName: string;
    targetAudience: string;
    createdAt: Date;
    status: AnalysisStatus;
    aiProcessingStage: string | null;
  };
  competitors: (Competitor & { features: CompetitorFeature[] })[];
  comparisonParameters: ComparisonParameter[];
  featureMatrixScores: FeatureMatrixScore[];
  positioningData: PositioningData[];
  simulatedReviews: SimulatedReview[];
}

export interface IntelligenceData {
  marketIntelligence: MarketIntelligence | null;
}

export interface GapsData {
  userFeatures: UserFeature[];
  blueOceanInsight: BlueOceanInsight | null;
  gapAnalysisItems: GapAnalysisItem[];
}

export interface PersonasData {
  personas: Persona[];
}

export interface AnalysisStatusResponse {
  status: AnalysisStatus;
  aiProcessingStage?: string | null;
  errorMessage?: string | null;
}

export interface AnalysisListItem {
  id: string;
  appName: string;
  targetAudience: string;
  status: AnalysisStatus;
  createdAt: string;
  updatedAt: string;
  competitorCount: number;
  errorMessage?: string | null;
}

export interface AnalysisListResponse {
  analyses: AnalysisListItem[];
}

export interface PositioningMapData {
  positions: (PositioningData & {
    competitorType?: CompetitorType;
  })[];
}

export interface PersonaChatHistoryResponse {
  messages: PersonaChatMessage[];
}

// Validation Error Types

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiError {
  error: string;
  validationErrors?: ValidationError[];
}

export interface ProjectData {
  appName?: string;
  targetAudience?: string;
  description?: string;
  features?: {
    name: string;
    description?: string;
  }[];
}

export interface ProjectResponse {
  projectId: string;
  name?: string;
  data: ProjectData;
  createdAt: string;
  updatedAt: string;
}

// Prisma types that might be needed
import type { CompetitorFeature } from './database';
