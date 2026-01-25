import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NotFoundError, AuthorizationError, formatErrorResponse } from '@/lib/utils/errors';

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

    // 2. Fetch core analysis details only
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
    });

    if (!analysis) {
      throw new NotFoundError('Analysis not found');
    }

    // 3. Verify ownership
    if (analysis.userId !== userId) {
      throw new AuthorizationError('You do not have access to this analysis');
    }

    // 4. Return core analysis data
    return NextResponse.json(analysis);
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
