import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { GapsDataResponse } from '@/types/api';

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

    // 2. Fetch all data required for the strategic gaps tab
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: {
        userId: true, // Needed for ownership check
        userFeatures: {
          orderBy: { orderIndex: 'asc' },
        },
        gapAnalysisItems: {
          orderBy: { orderIndex: 'asc' },
        },
        blueOceanInsight: true,
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 4. Construct and return the response payload
    const response: GapsDataResponse = {
      userFeatures: analysis.userFeatures,
      gapAnalysisItems: analysis.gapAnalysisItems,
      blueOceanInsight: analysis.blueOceanInsight,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching strategic gaps data:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json({ error: errorResponse.error }, { status: errorResponse.statusCode });
  }
}
