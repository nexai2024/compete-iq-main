import OpenAI from 'openai';
import type { Analysis, UserFeature } from '@/types/database';
import type { CompetitorSearchResult, CompetitorEnrichmentResult } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Search for competitors using Perplexity API
 */
export async function searchCompetitors(
  analysis: Analysis & { userFeatures: UserFeature[] }
): Promise<CompetitorSearchResult[]> {
  try {
    // Build search query
    const keyFeatures = analysis.userFeatures
      .slice(0, 5)
      .map((f) => f.featureName)
      .join(', ');

    const searchQuery = `Find competitors and alternatives for ${analysis.appName}, which is ${analysis.description.substring(0, 200)}. Target audience: ${analysis.targetAudience}. Similar apps in the market that offer ${keyFeatures}.`;

    // Call Perplexity API
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content:
              'You are a market research assistant. Find direct and indirect competitors for the given app idea. Return results in structured JSON format.',
          },
          {
            role: 'user',
            content: `${searchQuery}

Please identify:
- 4 direct competitors (apps that solve the exact same problem)
- 2 indirect competitors (apps that solve similar problems differently or serve adjacent markets)

For each competitor, provide:
- name (company/product name)
- type (direct or indirect)
- description (2-3 sentences about what they do)
- website_url
- market_position (their positioning/unique angle)
- pricing_model (Freemium, Subscription, One-time, Enterprise, etc.)
- founded_year (if available)

Return as a JSON object with a "competitors" array.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from Perplexity API');
    }

    // Parse JSON response
    let parsedData: { competitors: CompetitorSearchResult[] };
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      // If JSON parsing fails, use OpenAI to extract structured data
      parsedData = await extractCompetitorsWithOpenAI(content);
    }

    // Validate and filter results
    const competitors = parsedData.competitors || [];
    const directCompetitors = competitors.filter((c) => c.type === 'direct').slice(0, 4);
    const indirectCompetitors = competitors.filter((c) => c.type === 'indirect').slice(0, 2);

    return [...directCompetitors, ...indirectCompetitors];
  } catch (error) {
    console.error('Error searching competitors:', error);
    // Return empty array on error - analysis can continue without competitors
    return [];
  }
}

/**
 * Extract competitors using OpenAI when Perplexity returns unstructured data
 */
async function extractCompetitorsWithOpenAI(content: string): Promise<{ competitors: CompetitorSearchResult[] }> {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: 'Extract competitor information from the following text and return it as structured JSON.',
      },
      {
        role: 'user',
        content: `Extract competitors from this text and return a JSON object with a "competitors" array. Each competitor should have: name, type (direct or indirect), description, website_url, market_position, pricing_model, founded_year.

Text:
${content}`,
      },
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  const result = JSON.parse(response.choices[0].message.content || '{"competitors":[]}');
  return result;
}

/**
 * Enrich competitor data with OpenAI
 */
export async function enrichCompetitorData(
  competitorName: string,
  competitorDescription: string
): Promise<CompetitorEnrichmentResult> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a market research analyst. Enrich competitor data and extract key features.',
        },
        {
          role: 'user',
          content: `Competitor: ${competitorName}
Description: ${competitorDescription}

Tasks:
1. If missing, estimate founded_year based on market knowledge
2. Refine market_position to be concise and insightful
3. List 5-8 key features this competitor offers

Return as JSON:
{
  "founded_year": number or null,
  "market_position": "refined positioning",
  "features": [
    {
      "name": "feature name",
      "description": "brief description",
      "category": "Core|Premium|Integration|Mobile",
      "is_paid": boolean or null
    }
  ]
}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return {
      founded_year: result.founded_year || null,
      market_position: result.market_position || '',
      features: result.features || [],
    };
  } catch (error) {
    console.error(`Error enriching competitor ${competitorName}:`, error);
    return {
      founded_year: null,
      market_position: '',
      features: [],
    };
  }
}
