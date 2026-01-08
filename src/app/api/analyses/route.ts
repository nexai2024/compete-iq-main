import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { createAnalysisSchema } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';
import type { CreateAnalysisRequest, CreateAnalysisResponse, AnalysisListResponse, AnalysisListItem } from '@/types/api';
import type { AnalysisStatus } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse and validate request body
    const body: CreateAnalysisRequest = await request.json();
    const validationResult = createAnalysisSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { appName, targetAudience, description, features } = validationResult.data;

    // 3. Create analysis record
    const analysis = await prisma.analysis.create({
      data: {
        userId,
        appName,
        targetAudience,
        description,
        status: 'processing',
        aiProcessingStage: 'competitors',
      },
    });

    // 4. Create user features
    type FeatureInput = typeof features[0];
    await prisma.userFeature.createMany({
      data: features.map((feature: FeatureInput, index: number) => ({
        analysisId: analysis.id,
        featureName: feature.name,
        featureDescription: feature.description || null,
        orderIndex: index,
      })),
    });

    // 5. Trigger background AI processing (non-blocking)
    // Import the processing pipeline function
    const { processAnalysis } = await import('@/lib/ai/processing-pipeline');

    // Run in background - don't await
    processAnalysis(analysis.id).catch((error) => {
      console.error(`Error processing analysis ${analysis.id}:`, error);
      // Update analysis status to failed with a generic error message
      prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'failed',
          errorMessage: 'Processing failed unexpectedly. Please try again.',
        },
      }).catch(console.error);
    });

    // 6. Return success response
    const response: CreateAnalysisResponse = {
      analysisId: analysis.id,
      status: analysis.status,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating analysis:', error);
    const { error: errorMessage, statusCode } = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const sortBy = searchParams.get('sortBy') || 'newest';

    // 3. Build query filters
    const whereClause: { userId: string; status?: AnalysisStatus } = { userId };

    // Add status filter if valid
    if (statusParam && ['completed', 'processing', 'failed'].includes(statusParam)) {
      whereClause.status = statusParam as AnalysisStatus;
    }

    // 4. Query analyses with competitor count
    const analyses = await prisma.analysis.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { competitors: true },
        },
      },
      orderBy: {
        createdAt: sortBy === 'oldest' ? 'asc' : 'desc',
      },
    });

    // 5. Transform to response format
    type AnalysisWithCount = typeof analyses[0];
    const analysisListItems: AnalysisListItem[] = analyses.map((analysis: AnalysisWithCount) => ({
      id: analysis.id,
      appName: analysis.appName,
      targetAudience: analysis.targetAudience,
      status: analysis.status,
      createdAt: analysis.createdAt.toISOString(),
      updatedAt: analysis.updatedAt.toISOString(),
      competitorCount: analysis._count.competitors,
      errorMessage: analysis.errorMessage,
    }));

    // 6. Return response
    const response: AnalysisListResponse = {
      analyses: analysisListItems,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error fetching analyses:', error);
    const { error: errorMessage, statusCode } = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
