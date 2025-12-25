import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { createAnalysisSchema } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';
import type { CreateAnalysisRequest, CreateAnalysisResponse } from '@/types/api';

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
    await prisma.userFeature.createMany({
      data: features.map((feature, index) => ({
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
      // Update analysis status to failed
      prisma.analysis.update({
        where: { id: analysis.id },
        data: {
          status: 'failed',
          errorMessage: error.message || 'Processing failed',
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
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
