import OpenAI from 'openai';
import type { Analysis, UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { PositioningMapDataPoint } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate positioning data for Value vs Complexity map
 */
export async function generatePositioningData(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<PositioningMapDataPoint[]> {
  try {
    const userFeaturesList = analysis.userFeatures
      .map((f) => `- ${f.featureName}${f.featureDescription ? `: ${f.featureDescription}` : ''}`)
      .join('\n');

    const competitorsWithFeatures = competitors
      .map(
        (c) =>
          `${c.name}:
Features: ${c.features.map((f) => f.featureName).join(', ')}`
      )
      .join('\n\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are evaluating apps on two dimensions: Value and Complexity.',
        },
        {
          role: 'user',
          content: `Evaluate the following apps for a 2x2 positioning map:

User's App: ${analysis.appName}
Features:
${userFeaturesList}

Competitors:
${competitorsWithFeatures}

For EACH app (user + ${competitors.length} competitors), score:

1. Value Score (0-10): User value delivered
   - Problem-solving effectiveness
   - Feature richness and quality
   - User experience and polish
   - Innovation and differentiation

2. Complexity Score (0-10): Implementation and usage complexity
   - Technical sophistication required
   - Learning curve for users
   - Setup and maintenance effort
   - Feature bloat vs simplicity

Return JSON object with "positions" array:
{
  "positions": [
    {
      "entity_name": "app name",
      "is_user_app": true,
      "value_score": 7.5,
      "complexity_score": 6.0,
      "reasoning": "brief explanation"
    }
  ]
}

Include ALL apps: the user's app (is_user_app: true) and all ${competitors.length} competitors (is_user_app: false).`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"positions":[]}');
    const positions = result.positions || [];

    // Map to proper format with entity IDs
    const positioningData: PositioningMapDataPoint[] = [];

    for (const position of positions) {
      if (position.is_user_app) {
        positioningData.push({
          entity_type: 'user_app',
          entity_id: null,
          entity_name: analysis.appName,
          value_score: Math.min(10, Math.max(0, position.value_score)),
          complexity_score: Math.min(10, Math.max(0, position.complexity_score)),
          reasoning: position.reasoning || 'Positioned based on feature analysis',
        });
      } else {
        // Find matching competitor
        const competitor = competitors.find(
          (c) => c.name.toLowerCase() === position.entity_name.toLowerCase()
        );

        if (competitor) {
          positioningData.push({
            entity_type: 'competitor',
            entity_id: competitor.id,
            entity_name: competitor.name,
            value_score: Math.min(10, Math.max(0, position.value_score)),
            complexity_score: Math.min(10, Math.max(0, position.complexity_score)),
            reasoning: position.reasoning || 'Positioned based on feature analysis',
          });
        }
      }
    }

    return positioningData;
  } catch (error) {
    console.error('Error generating positioning data:', error);
    // Return default positioning
    return getDefaultPositioning(analysis, competitors);
  }
}

/**
 * Get default positioning as fallback
 */
function getDefaultPositioning(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): PositioningMapDataPoint[] {
  const positions: PositioningMapDataPoint[] = [];

  // Position user app in middle
  positions.push({
    entity_type: 'user_app',
    entity_id: null,
    entity_name: analysis.appName,
    value_score: 7.0,
    complexity_score: 5.0,
    reasoning: 'Default positioning - sweet spot target',
  });

  // Position competitors with some variation
  competitors.forEach((competitor, index) => {
    const baseValue = 6.5;
    const baseComplexity = 5.5;
    const variation = (index % 3) - 1; // -1, 0, 1

    positions.push({
      entity_type: 'competitor',
      entity_id: competitor.id,
      entity_name: competitor.name,
      value_score: Math.min(10, Math.max(0, baseValue + variation)),
      complexity_score: Math.min(10, Math.max(0, baseComplexity + variation * 0.5)),
      reasoning: 'Default positioning based on competitor type',
    });
  });

  return positions;
}
