import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { sendPersonaMessageSchema } from '@/lib/utils/validation';
import { formatErrorResponse } from '@/lib/utils/errors';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string; personaId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { analysisId, personaId } = await params;

    // 2. Validate request body
    const body = await request.json();
    const validationResult = sendPersonaMessageSchema.safeParse(body);

    if (!validationResult.success) {
      const errorResponse = formatErrorResponse(validationResult.error);
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const { message: userMessage } = validationResult.data;

    // 3. Verify analysis belongs to user
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { userId: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied - analysis belongs to different user' },
        { status: 403 }
      );
    }

    // 4. Verify persona belongs to analysis
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    if (persona.analysisId !== analysisId) {
      return NextResponse.json(
        { error: 'Invalid persona for this analysis' },
        { status: 400 }
      );
    }

    // 5. Save user message to database
    await prisma.personaChatMessage.create({
      data: {
        personaId,
        role: 'user',
        message: userMessage,
      },
    });

    // 6. Fetch message history for context (last 10 messages)
    const messageHistory = await prisma.personaChatMessage.findMany({
      where: { personaId },
      orderBy: { createdAt: 'asc' },
      take: 10,
    });

    // 7. Create OpenAI chat completion with streaming
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: persona.systemPrompt },
      ...messageHistory.map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.message,
      })),
    ];

    const stream = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      stream: true,
      temperature: 0.7,
      max_tokens: 500,
    });

    // 8. Set up SSE response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullResponse = '';
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              fullResponse += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }

          // 9. Save assistant response to database
          await prisma.personaChatMessage.create({
            data: {
              personaId,
              role: 'assistant',
              message: fullResponse,
            },
          });

          // 10. Send [DONE] and close stream
          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream failed' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error processing message:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ analysisId: string; personaId: string }> }
) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { analysisId, personaId } = await params;

    // 2. Verify analysis belongs to user
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      select: { userId: true },
    });

    if (!analysis) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 });
    }

    if (analysis.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied - analysis belongs to different user' },
        { status: 403 }
      );
    }

    // 3. Verify persona belongs to analysis
    const persona = await prisma.persona.findUnique({
      where: { id: personaId },
    });

    if (!persona) {
      return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
    }

    if (persona.analysisId !== analysisId) {
      return NextResponse.json(
        { error: 'Invalid persona for this analysis' },
        { status: 400 }
      );
    }

    // 4. Fetch all messages for persona
    const messages = await prisma.personaChatMessage.findMany({
      where: { personaId },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Return messages
    return NextResponse.json({ messages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}
