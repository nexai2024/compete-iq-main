import OpenAI from 'openai';
import type { Analysis, UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { ComparisonParameterData, FeatureScoreData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate comparison parameters based on app type and competitors
 */
export async function generateComparisonParameters(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<ComparisonParameterData[]> {
  try {
    const userFeaturesList = analysis.userFeatures.map((f) => f.featureName).join(', ');
    const competitorsList = competitors.map((c) => c.name).join(', ');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a product comparison expert. Determine the most relevant comparison parameters for evaluating apps in this space.',
        },
        {
          role: 'user',
          content: `App Category: ${analysis.appName}
Target Audience: ${analysis.targetAudience}
User's Features: ${userFeaturesList}
Competitors: ${competitorsList}

Determine 10 key parameters to compare these apps on. Parameters should be:
- Specific to this industry/app type
- Measurable or evaluable
- Important to the target audience
- Mix of functional and non-functional (UX, pricing, performance, etc.)

Return as JSON array:
[
  {
    "name": "parameter name (e.g., 'Real-time Collaboration')",
    "description": "what this measures",
    "weight": 0.X  // importance weight 0.0-1.0, all should sum to ~1.0
  }
]`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"parameters":[]}');
    const parameters = result.parameters || [];

    // Normalize weights to sum to 1.0
    const totalWeight = parameters.reduce((sum: number, p: ComparisonParameterData) => sum + p.weight, 0);
    if (totalWeight > 0) {
      parameters.forEach((p: ComparisonParameterData) => {
        p.weight = p.weight / totalWeight;
      });
    }

    return parameters.slice(0, 10);
  } catch (error) {
    console.error('Error generating comparison parameters:', error);
    // Return default parameters as fallback
    return getDefaultParameters();
  }
}

/**
 * Score an entity (user app or competitor) on a specific parameter
 */
export async function scoreEntities(
  parameterName: string,
  parameterDescription: string,
  entityType: 'user_app' | 'competitor',
  entityId: string | null,
  userFeatures: UserFeature[],
  competitorFeatures: CompetitorFeature[]
): Promise<FeatureScoreData> {
  try {
    const features = entityType === 'user_app'
      ? userFeatures.map((f) => `${f.featureName}: ${f.featureDescription || 'No description'}`).join('\n')
      : competitorFeatures.map((f) => `${f.featureName}: ${f.featureDescription || 'No description'}`).join('\n');

    const entityName = entityType === 'user_app' ? 'User\'s App' : 'Competitor';

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are evaluating apps on specific criteria. Provide objective scores with reasoning.',
        },
        {
          role: 'user',
          content: `Evaluate: ${entityName}
Parameter: ${parameterName} - ${parameterDescription}

${entityType === 'user_app' ? 'User\'s planned features' : 'Competitor features'}:
${features}

Score this app on the parameter from 0-10:
- 0-3: Poor/Missing
- 4-6: Average/Moderate
- 7-8: Good/Strong
- 9-10: Excellent/Best-in-class

Return JSON:
{
  "score": X.X,
  "reasoning": "brief explanation of score"
}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"score":5.0,"reasoning":"Unable to determine"}');

    return {
      score: Math.min(10, Math.max(0, result.score || 5.0)),
      reasoning: result.reasoning || 'Score based on feature analysis',
    };
  } catch (error) {
    console.error(`Error scoring ${entityType}:`, error);
    return {
      score: 5.0,
      reasoning: 'Default score due to analysis error',
    };
  }
}

/**
 * Default parameters as fallback
 */
function getDefaultParameters(): ComparisonParameterData[] {
  return [
    { name: 'User Experience', description: 'Ease of use and interface quality', weight: 0.12 },
    { name: 'Feature Completeness', description: 'Breadth and depth of features', weight: 0.11 },
    { name: 'Pricing', description: 'Value for money and pricing model', weight: 0.10 },
    { name: 'Performance', description: 'Speed and reliability', weight: 0.10 },
    { name: 'Mobile Support', description: 'Mobile app quality and features', weight: 0.09 },
    { name: 'Integration Capabilities', description: 'Third-party integrations', weight: 0.10 },
    { name: 'Customization', description: 'Ability to tailor to specific needs', weight: 0.09 },
    { name: 'Customer Support', description: 'Support quality and availability', weight: 0.10 },
    { name: 'Security', description: 'Data protection and privacy', weight: 0.10 },
    { name: 'Innovation', description: 'Unique features and forward-thinking', weight: 0.09 },
  ];
}
