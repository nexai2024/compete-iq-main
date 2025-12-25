import OpenAI from 'openai';
import type { UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { MVPPriorityData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GapSummary {
  deficits: Array<{ title: string; severity: string }>;
  standouts: Array<{ title: string; opportunity_score: number }>;
}

/**
 * Prioritize features as P0/P1/P2 for MVP planning
 */
export async function prioritizeFeatures(
  userFeatures: UserFeature[],
  competitors: (Competitor & { features: CompetitorFeature[] })[],
  gapAnalysis: GapSummary
): Promise<MVPPriorityData[]> {
  try {
    const featuresList = userFeatures
      .map((f, idx) => `Feature ${idx + 1}: ${f.featureName}${f.featureDescription ? ` - ${f.featureDescription}` : ''}`)
      .join('\n');

    const competitorsSummary = competitors
      .map((c) => `${c.name}: ${c.features.length} features`)
      .join(', ');

    const deficitsSummary = gapAnalysis.deficits
      .map((d) => `${d.title} (${d.severity})`)
      .join(', ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a product strategy expert. Prioritize features for MVP development.',
        },
        {
          role: 'user',
          content: `User's Features:
${featuresList}

Competitor Analysis: ${competitorsSummary}
Gap Analysis Deficits: ${deficitsSummary}

For EACH feature, assign a priority:

- P0 (Must Have for MVP):
  - Core value proposition
  - Critical to solving main user problem
  - Necessary for competitive parity
  - Without it, product isn't viable

- P1 (Competitive Parity):
  - Important for competition
  - Expected by users
  - Differentiates from basic alternatives
  - Should have in first full release

- P2 (Future Delight):
  - Nice to have
  - Delighters and innovations
  - Can wait for later iterations
  - Advanced or niche features

Return JSON array (one per feature):
[
  {
    "feature_index": 0,  // 0-based index matching input order
    "priority": "P0|P1|P2",
    "reasoning": "brief explanation"
  }
]`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"priorities":[]}');
    const priorities = result.priorities || [];

    // Map priorities to feature IDs
    return priorities.map((p: { feature_index: number; priority: string; reasoning: string }) => ({
      feature_id: userFeatures[p.feature_index]?.id || userFeatures[0].id,
      priority: p.priority as 'P0' | 'P1' | 'P2',
      reasoning: p.reasoning || 'Priority determined by strategic analysis',
    }));
  } catch (error) {
    console.error('Error prioritizing features:', error);
    // Return default priorities (split evenly)
    return userFeatures.map((feature, index) => ({
      feature_id: feature.id,
      priority: (index < userFeatures.length / 3 ? 'P0' : index < (userFeatures.length * 2) / 3 ? 'P1' : 'P2') as 'P0' | 'P1' | 'P2',
      reasoning: 'Default priority assignment',
    }));
  }
}
