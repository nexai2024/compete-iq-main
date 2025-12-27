import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { formatErrorResponse } from '@/lib/utils/errors';
import { fetchGitHubRepo, parseGitHubUrl, extractAppInfoFromRepo } from '@/lib/github/repo-analyzer';
import type { ExtractedAppInfo } from '@/lib/github/repo-analyzer';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // 2. Parse request body
    const body = await request.json();
    const { githubUrl, githubToken } = body;

    if (!githubUrl || typeof githubUrl !== 'string') {
      return NextResponse.json(
        { error: 'GitHub URL is required' },
        { status: 400 }
      );
    }

    // 3. Parse GitHub URL
    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL format. Please provide a valid GitHub repository URL.' },
        { status: 400 }
      );
    }

    // 4. Fetch repository data
    let repoInfo;
    try {
      repoInfo = await fetchGitHubRepo(parsed.owner, parsed.repo, githubToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repository';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // 5. Extract app information using AI
    let extractedInfo: ExtractedAppInfo;
    try {
      extractedInfo = await extractAppInfoFromRepo(repoInfo);
    } catch (error) {
      console.error('Error extracting app info:', error);
      return NextResponse.json(
        { error: 'Failed to analyze repository. Please try again.' },
        { status: 500 }
      );
    }

    // 6. Return extracted information
    return NextResponse.json({
      success: true,
      data: extractedInfo,
      repoInfo: {
        name: repoInfo.name,
        language: repoInfo.language,
        topics: repoInfo.topics,
      },
    });
  } catch (error) {
    console.error('Error in GitHub import:', error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(
      { error: errorResponse.error },
      { status: errorResponse.statusCode }
    );
  }
}

