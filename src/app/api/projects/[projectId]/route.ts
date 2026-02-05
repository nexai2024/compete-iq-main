import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { formatErrorResponse, NotFoundError, AuthenticationError } from '@/lib/utils/errors';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new AuthenticationError();

    const { projectId } = await params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== userId) {
      throw new NotFoundError('Project not found');
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new AuthenticationError();

    const { projectId } = await params;
    const project = await prisma.project.findUnique({ where: { id: projectId } });

    if (!project || project.userId !== userId) {
      throw new NotFoundError('Project not found');
    }

    await prisma.project.delete({ where: { id: projectId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
