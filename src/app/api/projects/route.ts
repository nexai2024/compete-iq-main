import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { formatErrorResponse, AuthorizationError, NotFoundError, AuthenticationError } from '@/lib/utils/errors';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) throw new AuthenticationError();

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
    const { userId } = await auth();
    if (!userId) throw new AuthenticationError();

    const body = await request.json();
    const { projectId, name, data } = body;

    if (projectId) {
      // Security: Verify project exists and belongs to user to prevent IDOR
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!existingProject) {
        throw new NotFoundError('Project not found');
      }

      if (existingProject.userId !== userId) {
        throw new AuthorizationError('You do not have access to this project');
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: { name, data },
      });
      return NextResponse.json({ project });
    }

    const project = await prisma.project.create({
      data: { userId, name, data },
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
