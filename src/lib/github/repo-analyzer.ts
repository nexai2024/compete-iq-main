import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface GitHubRepoInfo {
  name: string;
  description: string | null;
  readme: string | null;
  packageJson: string | null;
  mainFiles: Array<{ path: string; content: string }>;
  language: string | null;
  topics: string[];
}

export interface ExtractedAppInfo {
  appName: string;
  description: string;
  targetAudience: string;
  features: Array<{ name: string; description?: string }>;
}

/**
 * Fetch repository data from GitHub
 */
export async function fetchGitHubRepo(
  owner: string,
  repo: string,
  githubToken?: string
): Promise<GitHubRepoInfo> {
  const headers: HeadersInit = {
    Accept: 'application/vnd.github.v3+json',
  };

  if (githubToken) {
    headers.Authorization = `token ${githubToken}`;
  }

  // Fetch repo info
  const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers,
  });

  if (!repoResponse.ok) {
    if (repoResponse.status === 404) {
      throw new Error('Repository not found. Please check the repository URL.');
    }
    if (repoResponse.status === 403) {
      const rateLimitRemaining = repoResponse.headers.get('x-ratelimit-remaining');
      if (rateLimitRemaining === '0') {
        throw new Error('GitHub API rate limit exceeded. Please try again later or use a GitHub token.');
      }
      throw new Error('Access denied. The repository may be private. A GitHub token may be required.');
    }
    if (repoResponse.status === 429) {
      throw new Error('GitHub API rate limit exceeded. Please try again later or use a GitHub token.');
    }
    throw new Error(`GitHub API error: ${repoResponse.statusText}`);
  }

  const repoData = await repoResponse.json();

  // Fetch README
  let readme: string | null = null;
  try {
    const readmeResponse = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/readme`,
      { headers }
    );
      if (readmeResponse.ok) {
        const readmeData = await readmeResponse.json();
        if (readmeData.content && readmeData.encoding === 'base64') {
          readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
        }
      }
  } catch (error) {
    console.warn('Could not fetch README:', error);
  }

  // Fetch package.json or similar config files
  let packageJson: string | null = null;
  const configFiles = ['package.json', 'Cargo.toml', 'pyproject.toml', 'go.mod', 'pom.xml'];
  
  for (const file of configFiles) {
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${file}`,
        { headers }
      );
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.content && fileData.encoding === 'base64') {
          packageJson = Buffer.from(fileData.content, 'base64').toString('utf-8');
          break;
        }
      }
    } catch {
      // Continue to next file
    }
  }

  // Fetch main source files (limit to key files to avoid token limits)
  const mainFiles: Array<{ path: string; content: string }> = [];
  const keyFiles = [
    'src/index.ts',
    'src/index.tsx',
    'src/index.js',
    'src/index.jsx',
    'src/App.tsx',
    'src/App.jsx',
    'src/main.ts',
    'src/main.py',
    'src/main.rs',
    'app/page.tsx',
    'app/page.jsx',
    'pages/index.tsx',
    'pages/index.jsx',
  ];

  for (const filePath of keyFiles) {
    try {
      const fileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        { headers }
      );
      if (fileResponse.ok) {
        const fileData = await fileResponse.json();
        if (fileData.type === 'file' && fileData.size < 50000 && fileData.content) {
          // Only fetch files under 50KB
          if (fileData.encoding === 'base64') {
            const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
            mainFiles.push({ path: filePath, content });
            if (mainFiles.length >= 5) break; // Limit to 5 files
          }
        }
      }
    } catch {
      // Continue to next file
    }
  }

  return {
    name: repoData.name,
    description: repoData.description,
    readme,
    packageJson,
    mainFiles,
    language: repoData.language,
    topics: repoData.topics || [],
  };
}

/**
 * Parse GitHub URL to extract owner and repo
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  // Support various GitHub URL formats:
  // https://github.com/owner/repo
  // https://github.com/owner/repo/
  // github.com/owner/repo
  // owner/repo
  const patterns = [
    /^https?:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^github\.com\/([^\/]+)\/([^\/]+?)(?:\.git)?(?:\/|$)/,
    /^([^\/]+)\/([^\/]+?)(?:\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = url.trim().match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2].replace(/\.git$/, ''),
      };
    }
  }

  return null;
}

/**
 * Use AI to extract app information from repository data
 */
export async function extractAppInfoFromRepo(
  repoInfo: GitHubRepoInfo
): Promise<ExtractedAppInfo> {
  try {
    // Build context for AI
    const context = `
Repository: ${repoInfo.name}
Description: ${repoInfo.description || 'No description'}
Language: ${repoInfo.language || 'Unknown'}
Topics: ${repoInfo.topics.join(', ') || 'None'}

${repoInfo.readme ? `README:\n${repoInfo.readme.substring(0, 5000)}\n` : ''}

${repoInfo.packageJson ? `Package Config:\n${repoInfo.packageJson.substring(0, 2000)}\n` : ''}

Main Source Files:
${repoInfo.mainFiles
  .map((f) => `\n${f.path}:\n${f.content.substring(0, 2000)}`)
  .join('\n---\n')}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are an expert at analyzing code repositories and extracting product information. Analyze the provided repository data and extract the app name, description, target audience, and key features.',
        },
        {
          role: 'user',
          content: `Analyze this repository and extract:

1. **App Name**: The actual product/application name (not just the repo name)
2. **Description**: A comprehensive 2-3 sentence description of what the app does
3. **Target Audience**: Who would use this app? Be specific (e.g., "Small business owners", "Developers", "Students")
4. **Features**: List 5-10 key features the app provides. For each feature, provide:
   - A clear, concise name
   - A brief description (1-2 sentences)

Return as JSON:
{
  "appName": "Product Name",
  "description": "Detailed description of what the app does and its purpose",
  "targetAudience": "Specific target audience description",
  "features": [
    {
      "name": "Feature Name",
      "description": "What this feature does"
    }
  ]
}

Repository Data:
${context}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and provide defaults
    return {
      appName: result.appName || repoInfo.name,
      description:
        result.description ||
        repoInfo.description ||
        `An application built with ${repoInfo.language || 'various technologies'}`,
      targetAudience: result.targetAudience || 'General users',
      features:
        result.features && Array.isArray(result.features) && result.features.length > 0
          ? result.features.map((f: { name?: string; description?: string }) => ({
              name: f.name || 'Feature',
              description: f.description || undefined,
            }))
          : [
              {
                name: 'Core functionality',
                description: 'Main features of the application',
              },
            ],
    };
  } catch (error) {
    console.error('Error extracting app info:', error);
    // Return defaults based on repo info
    return {
      appName: repoInfo.name,
      description: repoInfo.description || `A ${repoInfo.language || 'software'} application`,
      targetAudience: 'General users',
      features: [
        {
          name: 'Core functionality',
          description: 'Main features extracted from repository',
        },
      ],
    };
  }
}

