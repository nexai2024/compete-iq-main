import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';

export async function POST(
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
      include: {
        userFeatures: true,
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 3. Check if analysis has features (required for rerun)
    if (!analysis.userFeatures || analysis.userFeatures.length === 0) {
      return NextResponse.json(
        { error: 'Cannot rerun analysis: no features found' },
        { status: 400 }
      );
    }

    // 4. Delete all related data (cascade will handle most, but we'll be explicit)
    // Delete in order to respect foreign key constraints
    await prisma.marketIntelligence.deleteMany({ where: { analysisId } });
    await prisma.simulatedReview.deleteMany({ where: { analysisId } });
    await prisma.positioningData.deleteMany({ where: { analysisId } });
    await prisma.personaChatMessage.deleteMany({
      where: { persona: { analysisId } },
    });
    await prisma.persona.deleteMany({ where: { analysisId } });
    await prisma.blueOceanInsight.deleteMany({ where: { analysisId } });
    await prisma.gapAnalysisItem.deleteMany({ where: { analysisId } });
    await prisma.featureMatrixScore.deleteMany({ where: { analysisId } });
    await prisma.comparisonParameter.deleteMany({ where: { analysisId } });
    await prisma.competitorFeature.deleteMany({
      where: { competitor: { analysisId } },
    });
    await prisma.competitor.deleteMany({ where: { analysisId } });

    // Reset user features (remove priorities and reasoning)
    await prisma.userFeature.updateMany({
      where: { analysisId },
      data: {
        mvpPriority: null,
        priorityReasoning: null,
      },
    });

    // 5. Reset analysis status
    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'processing',
        aiProcessingStage: 'competitors',
        errorMessage: null,
      },
    });

    // 6. Trigger background AI processing (non-blocking)
    const { processAnalysis } = await import('@/lib/ai/processing-pipeline');

    // Run in background - don't await
    processAnalysis(analysisId).catch((error) => {
      console.error(`Error processing rerun for analysis ${analysisId}:`, error);
      // Update analysis status to failed
      prisma.analysis
        .update({
          where: { id: analysisId },
          data: {
            status: 'failed',
            errorMessage: error.message || 'Processing failed',
          },
        })
        .catch(console.error);
    });

    // 7. Return success response
    return NextResponse.json({
      success: true,
      message: 'Analysis rerun initiated',
      analysisId,
    });
  } catch (error) {
    console.error('Error rerunning analysis:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

