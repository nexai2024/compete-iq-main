import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { OverviewData } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { analysisId } = params;

    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        competitors: {
          orderBy: { orderIndex: 'asc' },
          include: {
            features: true,
          },
        },
        comparisonParameters: {
          orderBy: { orderIndex: 'asc' },
        },
        featureMatrixScores: {
          include: {
            parameter: true,
            competitor: true,
          },
        },
        positioningData: {
          include: {
            competitor: {
              select: {
                type: true,
              },
            },
          },
        },
        simulatedReviews: {
          orderBy: { rating: 'desc' },
        },
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    type PositioningDataWithCompetitor = typeof analysis.positioningData[0];
    type CompetitorWithFeatures = typeof analysis.competitors[0];
    const enrichedPositioningData = analysis.positioningData.map((position: PositioningDataWithCompetitor) => {
      let competitorType: 'direct' | 'indirect' | undefined = undefined;
      if (position.entityType === 'competitor' && position.entityId) {
        const competitor = analysis.competitors.find((c: CompetitorWithFeatures) => c.id === position.entityId);
        competitorType = competitor?.type || undefined;
      }

      return {
        ...position,
        competitorType,
      };
    });

    type FeatureMatrixScoreWithRelations = typeof analysis.featureMatrixScores[0];
    const flattenedScores = analysis.featureMatrixScores.map((score: FeatureMatrixScoreWithRelations) => ({
      id: score.id,
      analysisId: score.analysisId,
      parameterId: score.parameterId,
      entityType: score.entityType,
      entityId: score.entityId,
      score: score.score,
      reasoning: score.reasoning,
      createdAt: score.createdAt,
    }));

    const response: OverviewData = {
      analysis: {
        id: analysis.id,
        appName: analysis.appName,
        targetAudience: analysis.targetAudience,
        createdAt: analysis.createdAt,
        status: analysis.status,
        aiProcessingStage: analysis.aiProcessingStage,
      },
      competitors: analysis.competitors,
      comparisonParameters: analysis.comparisonParameters,
      featureMatrixScores: flattenedScores,
      positioningData: enrichedPositioningData as typeof analysis.positioningData,
      simulatedReviews: analysis.simulatedReviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching overview data:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
