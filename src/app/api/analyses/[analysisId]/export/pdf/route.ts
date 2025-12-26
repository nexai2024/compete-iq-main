import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { formatErrorResponse } from '@/lib/utils/errors';
import { sanitizeFileName } from '@/lib/utils/formatting';
import { renderToStream } from '@react-pdf/renderer';
import { AnalysisPDFDocument } from '@/lib/export/PDFDocument';

export async function POST(
  request: NextRequest,
  { params }: { params: { analysisId: string } }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { analysisId } = params;

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
        positioningData: true,
        simulatedReviews: true,
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

    // 4. Generate PDF using react-pdf
    const pdfStream = await renderToStream(
      <AnalysisPDFDocument
        data={{
          analysis,
          userFeatures: analysis.userFeatures,
          competitors: analysis.competitors,
          comparisonParameters: analysis.comparisonParameters,
          featureMatrixScores: analysis.featureMatrixScores,
          gapAnalysisItems: analysis.gapAnalysisItems,
          blueOceanInsight: analysis.blueOceanInsight,
          personas: analysis.personas,
          positioningData: analysis.positioningData,
          simulatedReviews: analysis.simulatedReviews,
        }}
      />
    );

    // 5. Return as downloadable file
    const filename = sanitizeFileName(analysis.appName) || 'analysis';
    return new Response(pdfStream as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}-analysis.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating PDF export:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
