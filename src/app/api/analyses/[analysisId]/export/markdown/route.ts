import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { formatErrorResponse } from '@/lib/utils/errors';
import { sanitizeFileName } from '@/lib/utils/formatting';
import { generateMarkdownReport } from '@/lib/export/markdown-generator';

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

    // 2. Fetch complete analysis data with all relations
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        userFeatures: {
          orderBy: { orderIndex: 'asc' },
        },
        competitors: {
          include: {
            features: true,
          },
        },
        comparisonParameters: true,
        featureMatrixScores: true,
        gapAnalysisItems: true,
        blueOceanInsight: true,
        personas: true,
        positioningData: {
          include: {
            competitor: {
              select: {
                type: true,
              },
            },
          },
        },
        simulatedReviews: true,
        marketIntelligence: true,
      },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    // 3. Verify analysis belongs to user
    if (analysis.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied - analysis belongs to different user' },
        { status: 403 }
      );
    }

    // 4. Enrich positioning data with competitor type
    const enrichedPositioningData = analysis.positioningData.map((position) => ({
      ...position,
      competitorType: position.competitor?.type || undefined,
    }));

    // 5. Generate markdown report
    const markdown = generateMarkdownReport({
      analysis,
      userFeatures: analysis.userFeatures,
      competitors: analysis.competitors,
      comparisonParameters: analysis.comparisonParameters,
      featureMatrixScores: analysis.featureMatrixScores,
      gapAnalysisItems: analysis.gapAnalysisItems,
      blueOceanInsight: analysis.blueOceanInsight,
      personas: analysis.personas,
      positioningData: enrichedPositioningData as typeof analysis.positioningData,
      simulatedReviews: analysis.simulatedReviews,
      marketIntelligence: analysis.marketIntelligence,
    });

    // 6. Return as downloadable file
    const filename = sanitizeFileName(analysis.appName) || 'analysis';
    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}-analysis.md"`,
      },
    });
  } catch (error) {
    console.error('Error generating markdown export:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
