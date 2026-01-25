import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { OverviewDataResponse } from '@/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { analysisId } = await params;

    // 2. Fetch all data required for the overview tab
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        userId: true, // Needed for ownership check
        appName: true,
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

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 4. Enrich positioning data with competitor type
    const enrichedPositioningData = analysis.positioningData.map((position) => {
      let competitorType: 'direct' | 'indirect' | undefined = undefined;
      if (position.entityType === 'competitor' && position.entityId) {
        const competitor = analysis.competitors.find((c) => c.id === position.entityId);
        competitorType = competitor?.type || undefined;
      }
      return {
        ...position,
        competitorType,
      };
    });

    // 5. Flatten feature matrix scores for the client
    const flattenedScores = analysis.featureMatrixScores.map((score) => ({
      id: score.id,
      analysisId: score.analysisId,
      parameterId: score.parameterId,
      entityType: score.entityType,
      entityId: score.entityId,
      score: score.score,
      reasoning: score.reasoning,
      createdAt: score.createdAt,
    }));

    // 6. Construct and return the response payload
    const response: OverviewDataResponse = {
      appName: analysis.appName,
      competitors: analysis.competitors,
      comparisonParameters: analysis.comparisonParameters,
      featureMatrixScores: flattenedScores,
      positioningData: enrichedPositioningData,
      simulatedReviews: analysis.simulatedReviews,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching overview data:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode });
  }
}
