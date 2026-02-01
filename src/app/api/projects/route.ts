import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { saveProjectSchema } from '@/lib/utils/validation';
import { formatErrorResponse, AuthorizationError, NotFoundError } from '@/lib/utils/errors';

export async function GET() {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // 2. Fetch projects owned by this user
    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

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
    const body = await request.json();
    const validationResult = saveProjectSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { projectId, name, data } = validationResult.data;

    // 3. Handle Update (with IDOR protection) or Create
    if (projectId) {
      // SECURITY: Verify that the project exists and belongs to the authenticated user
      // before attempting an update to prevent Insecure Direct Object Reference (IDOR)
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
        select: { userId: true },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      if (existingProject.userId !== userId) {
        throw new AuthorizationError('You do not have permission to access this project');
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: name || undefined,
          data: data || undefined
        },
      });
      return NextResponse.json({ project });
    }

    // Create new project
    const project = await prisma.project.create({
      data: {
        userId,
        name: name || 'Untitled Project',
        data: data || {}
      },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error saving project:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
