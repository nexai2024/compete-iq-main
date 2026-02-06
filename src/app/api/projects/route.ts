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
    const { error: msg, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const validationResult = saveProjectSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(formatErrorResponse(validationResult.error), { status: 400 });
    }

    const { projectId, name, data } = validationResult.data;
    if (projectId) {
      const project = await prisma.project.findUnique({ where: { id: projectId } });
      if (!project || project.userId !== userId) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }

      const updated = await prisma.project.update({ where: { id: projectId }, data: { name, data } });
      return NextResponse.json({ project: updated });
    }

    const project = await prisma.project.create({ data: { userId, name, data } });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    console.error('Error saving project:', error);
    const { error: msg, statusCode } = formatErrorResponse(error);
    return NextResponse.json({ error: msg }, { status: statusCode });
  }
}
