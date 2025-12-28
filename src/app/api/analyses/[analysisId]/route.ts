import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { FullAnalysisResponse } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { analysisId } = await params;

    // 2. Fetch complete analysis with all relations
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        userFeatures: {
          orderBy: { orderIndex: 'asc' },
        },
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
        gapAnalysisItems: {
          orderBy: { orderIndex: 'asc' },
        },
        blueOceanInsight: true,
        personas: {
          orderBy: { orderIndex: 'asc' },
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
        marketIntelligence: true,
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 4. Enrich positioning data with competitor type
    type PositioningDataWithCompetitor = typeof analysis.positioningData[0];
    type CompetitorWithFeatures = typeof analysis.competitors[0];
    const enrichedPositioningData = analysis.positioningData.map((position: PositioningDataWithCompetitor) => {
      // Get competitor type if this is a competitor entity
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

    // 5. Flatten feature matrix scores (remove nested relations for client)
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

    // 6. Return full analysis data
    const response: FullAnalysisResponse = {
      analysis,
      userFeatures: analysis.userFeatures,
      competitors: analysis.competitors,
      comparisonParameters: analysis.comparisonParameters,
      featureMatrixScores: flattenedScores,
      gapAnalysisItems: analysis.gapAnalysisItems,
      blueOceanInsight: analysis.blueOceanInsight,
      personas: analysis.personas,
      positioningData: enrichedPositioningData as typeof analysis.positioningData,
      simulatedReviews: analysis.simulatedReviews,
      marketIntelligence: analysis.marketIntelligence,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching analysis:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const { analysisId } = await params;

    // 2. Verify analysis exists and user owns it
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 3. Delete analysis (cascade deletes all related data)
    await prisma.analysis.delete({
      where: { id: analysisId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting analysis:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
