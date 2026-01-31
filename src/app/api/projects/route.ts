import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { saveProjectSchema } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Parse and validate request body
    const body = await request.json();
    const validationResult = saveProjectSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { projectId, name, data } = validationResult.data;

    // 3. Handle update (with ownership check)
    if (projectId) {
      const existingProject = await prisma.project.findUnique({
        where: { id: projectId },
      });

      // Verify existence and ownership to prevent IDOR
      if (!existingProject || existingProject.userId !== userId) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const project = await prisma.project.update({
        where: { id: projectId },
        data: { name, data },
      });
      return NextResponse.json({ project });
    }

    // 4. Handle creation
    const project = await prisma.project.create({
      data: { userId, name, data },
    });

    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error saving project:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, { status: errorResponse.statusCode });
  }
}
