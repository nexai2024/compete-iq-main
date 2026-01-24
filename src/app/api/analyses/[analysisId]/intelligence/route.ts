import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';
import type { IntelligenceData } from '@/types/api';

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
        marketIntelligence: true,
      },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    const response: IntelligenceData = {
      marketIntelligence: analysis.marketIntelligence,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching intelligence data:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
