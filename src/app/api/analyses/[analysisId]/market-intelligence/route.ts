import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';

/**
 * @swagger
 * /api/analyses/{analysisId}/market-intelligence:
 *   get:
 *     summary: Get market intelligence for a specific analysis
 *     description: Fetches the market intelligence data associated with a given analysis ID.
 *     tags:
 *       - Analyses
 *     parameters:
 *       - in: path
 *         name: analysisId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the analysis.
 *     responses:
 *       '200':
 *         description: Successfully retrieved market intelligence data.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/MarketIntelligence'
 *       '401':
 *         description: Authentication required.
 *       '403':
 *         description: User does not have access to this analysis.
 *       '404':
 *         description: Analysis or market intelligence not found.
 *       '500':
 *         description: Internal server error.
 */
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

    // ⚡ Bolt-NOTE: This project's build tooling requires the unconventional `await params` pattern.
    // Standard Next.js App Router convention would be `{ params }: { params: { analysisId: string } }`.
    // See conversation in PR for details.
    const { analysisId } = await params;

    // 2. Fetch the analysis to verify ownership first
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { userId: true },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 4. Fetch the market intelligence data
    const marketIntelligence = await prisma.marketIntelligence.findUnique({
      where: { analysisId: analysisId },
    });

    return NextResponse.json(marketIntelligence);
  } catch (error) {
    console.error('Error fetching market intelligence:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
