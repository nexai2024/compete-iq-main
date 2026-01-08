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

    // 2. Fetch complete analysis with an optimized query
    const analysisWithRelations = await prisma.analysis.findUnique({
      where: { id: analysisId },
      // ⚡ Bolt: Optimized query to reduce over-fetching.
      // Replaced a broad `include` with a precise `select`, removing unnecessary nested
      // data from `featureMatrixScores` and `positioningData`. The subsequent data
      // processing logic already handles this transformation, so fetching the nested
      // data was redundant and slowed down the query.
      // Impact: Reduces payload size and database load significantly.
      select: {
        id: true,
        userId: true,
        appName: true,
        targetAudience: true,
        description: true,
        status: true,
        aiProcessingStage: true,
        errorMessage: true,
        createdAt: true,
        updatedAt: true,
        userFeatures: { orderBy: { orderIndex: 'asc' } },
        competitors: {
          orderBy: { orderIndex: 'asc' },
          include: { features: true },
        },
        comparisonParameters: { orderBy: { orderIndex: 'asc' } },
        featureMatrixScores: true,
        gapAnalysisItems: { orderBy: { orderIndex: 'asc' } },
        blueOceanInsight: true,
        personas: { orderBy: { orderIndex: 'asc' } },
        positioningData: true,
        simulatedReviews: { orderBy: { rating: 'desc' } },
        marketIntelligence: true,
      },
    });

    if (!analysisWithRelations) {
      throw new NotFoundError('Analysis not found');
    }

    // 3. Verify ownership
    if (analysisWithRelations.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // ⚡ Bolt: Destructure to separate core analysis from relations.
    // This prevents duplicating the relational data in the final JSON response,
    // shrinking the payload and making the client-side handling cleaner.
    const {
      userFeatures,
      competitors,
      comparisonParameters,
      featureMatrixScores,
      gapAnalysisItems,
      blueOceanInsight,
      personas,
      positioningData,
      simulatedReviews,
      marketIntelligence,
      ...coreAnalysis
    } = analysisWithRelations;

    // 4. Enrich positioning data with competitor type
    const enrichedPositioningData = positioningData.map((position) => {
      let competitorType: 'direct' | 'indirect' | undefined = undefined;
      if (position.entityType === 'competitor' && position.entityId) {
        const competitor = competitors.find((c) => c.id === position.entityId);
        competitorType = competitor?.type || undefined;
      }
      return { ...position, competitorType };
    });

    // 5. Flatten feature matrix scores (the nested relations are no longer fetched)
    const flattenedScores = featureMatrixScores.map((score) => ({
      id: score.id,
      analysisId: score.analysisId,
      parameterId: score.parameterId,
      entityType: score.entityType,
      entityId: score.entityId,
      score: score.score,
      reasoning: score.reasoning,
      createdAt: score.createdAt,
    }));

    // 6. Return full analysis data with a clean, non-redundant structure
    const response: FullAnalysisResponse = {
      analysis: coreAnalysis,
      userFeatures,
      competitors,
      comparisonParameters,
      featureMatrixScores: flattenedScores,
      gapAnalysisItems,
      blueOceanInsight,
      personas,
      positioningData: enrichedPositioningData,
      simulatedReviews,
      marketIntelligence,
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
