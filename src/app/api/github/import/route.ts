import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
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
    const { githubUrl } = body;

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

    // 4. Securely fetch GitHub token from Clerk
    let accessToken: string | undefined;
    try {
      const client = await clerkClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tokenResponse: any = await client.users.getUserOauthAccessToken(userId, 'oauth_github');
      accessToken = tokenResponse[0]?.token;

      if (!accessToken) {
        // Fallback for users who signed up with GitHub but token is not available
        const user = await client.users.getUser(userId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const githubAccount: any = user.externalAccounts.find((acc: any) => acc.provider === 'oauth_github');
        if (githubAccount && githubAccount.accessToken) {
          accessToken = githubAccount.accessToken;
        }
      }
    } catch (error) {
      console.warn(`Could not retrieve OAuth token for user ${userId}:`, error);
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'GitHub account not linked or token is missing. Please connect your GitHub account.' },
        { status: 403 }
      );
    }

    // 5. Fetch repository data
    let repoInfo;
    try {
      repoInfo = await fetchGitHubRepo(parsed.owner, parsed.repo, accessToken);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch repository';
      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      );
    }

    // 6. Extract app information using AI
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

    // 7. Return extracted information
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

