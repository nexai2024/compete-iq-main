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

    type CompetitorWithFeatures = typeof competitors[0];
    const competitorsSummary = competitors
      .map((c: CompetitorWithFeatures) => `${c.name}: ${c.features.length} features`)
      .join(', ');

    type DeficitData = typeof gapAnalysis.deficits[0];
    const deficitsSummary = gapAnalysis.deficits
      .map((d: DeficitData) => `${d.title} (${d.severity})`)
      .join(', ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a product strategy expert. Prioritize features for MVP development. You MUST assign a priority to EVERY feature.',
        },
        {
          role: 'user',
          content: `User's Features (${userFeatures.length} total):
${featuresList}

Competitor Analysis: ${competitorsSummary}
Gap Analysis Deficits: ${deficitsSummary}

For EACH of the ${userFeatures.length} features listed above, assign a priority:

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

IMPORTANT: You must return priorities for ALL ${userFeatures.length} features. Use feature_index 0 through ${userFeatures.length - 1}.

Return JSON object with "priorities" array:
{
  "priorities": [
    {
      "feature_index": 0,  // 0-based index matching input order (0 to ${userFeatures.length - 1})
      "priority": "P0|P1|P2",
      "reasoning": "brief explanation"
    },
    // ... one entry for each feature
  ]
}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"priorities":[]}');
    const priorities = result.priorities || [];

    // Ensure we have priorities for all features
    const priorityMap = new Map<number, { priority: 'P0' | 'P1' | 'P2'; reasoning: string }>();
    
    priorities.forEach((p: { feature_index: number; priority: string; reasoning: string }) => {
      const index = p.feature_index;
      if (index >= 0 && index < userFeatures.length) {
        priorityMap.set(index, {
          priority: (p.priority || 'P2') as 'P0' | 'P1' | 'P2',
          reasoning: p.reasoning || 'Priority determined by strategic analysis',
        });
      }
    });

    // Map priorities to feature IDs, ensuring all features get a priority
    return userFeatures.map((feature, index) => {
      const priority = priorityMap.get(index) || {
        priority: (index < userFeatures.length / 3 ? 'P0' : index < (userFeatures.length * 2) / 3 ? 'P1' : 'P2') as 'P0' | 'P1' | 'P2',
        reasoning: 'Default priority assignment - AI did not return priority for this feature',
      };
      
      return {
        feature_id: feature.id,
        priority: priority.priority,
        reasoning: priority.reasoning,
      };
    });
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
