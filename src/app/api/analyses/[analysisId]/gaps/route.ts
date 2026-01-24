import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { GapsData } from '@/types/api';

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
        userFeatures: {
          orderBy: { orderIndex: 'asc' },
        },
        blueOceanInsight: true,
        gapAnalysisItems: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    const response: GapsData = {
      userFeatures: analysis.userFeatures,
      blueOceanInsight: analysis.blueOceanInsight,
      gapAnalysisItems: analysis.gapAnalysisItems,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching gaps data:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
