import OpenAI from 'openai';
import { prisma } from '@/lib/db/prisma';
import type { Analysis, UserFeature, Competitor, CompetitorFeature, NormalizedFeatureGroup, ComparisonParameter } from '@/types/database';
import type { ComparisonParameterData, FeatureScoreData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get normalized feature summary for a set of features
 * Groups features by their normalized groups and returns a summary
 */
export async function getNormalizedFeatureSummary(
  features: (UserFeature | CompetitorFeature)[],
  normalizedGroups: NormalizedFeatureGroup[]
): Promise<string> {
  // Create a map for faster group lookups
  const groupsMap = new Map(normalizedGroups.map(g => [g.id, g.canonicalName]));

  // Group features by normalized group
  const groupedFeatures = new Map<string, (UserFeature | CompetitorFeature)[]>();
  const ungroupedFeatures: (UserFeature | CompetitorFeature)[] = [];

  for (const feature of features) {
    // Both UserFeature and CompetitorFeature have normalizedGroupId
    const normalizedGroupId = (feature as { normalizedGroupId?: string | null }).normalizedGroupId;
    if (normalizedGroupId) {
      const groupName = groupsMap.get(normalizedGroupId);
      if (groupName) {
        if (!groupedFeatures.has(groupName)) {
          groupedFeatures.set(groupName, []);
        }
        groupedFeatures.get(groupName)!.push(feature);
      } else {
        ungroupedFeatures.push(feature);
      }
    } else {
      ungroupedFeatures.push(feature);
    }
  }

  // Build summary with normalized groups
  const summaryParts: string[] = [];

  // Add grouped features
  groupedFeatures.forEach((groupFeatures: (UserFeature | CompetitorFeature)[], groupName: string) => {
    const featureDetails = groupFeatures
      .map((f: UserFeature | CompetitorFeature) => `  - ${f.featureName}${f.featureDescription ? `: ${f.featureDescription}` : ''}`)
      .join('\n');
    summaryParts.push(`${groupName}:\n${featureDetails}`);
  });

  // Add ungrouped features
  if (ungroupedFeatures.length > 0) {
    const ungroupedDetails = ungroupedFeatures
      .map((f: UserFeature | CompetitorFeature) => `  - ${f.featureName}${f.featureDescription ? `: ${f.featureDescription}` : ''}`)
      .join('\n');
    summaryParts.push(`Other Features:\n${ungroupedDetails}`);
  }

  return summaryParts.join('\n\n');
}

/**
 * Generate comparison parameters based on app type and competitors
 */
export async function generateComparisonParameters(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<ComparisonParameterData[]> {
  try {
    // Fetch normalized groups for this analysis
    const normalizedGroups = await prisma.normalizedFeatureGroup.findMany({
      where: { analysisId: analysis.id },
    });

    // Get normalized feature summary for user features
    const userFeaturesSummary = await getNormalizedFeatureSummary(
      analysis.userFeatures,
      normalizedGroups
    );
    
    type CompetitorWithFeatures = typeof competitors[0];
    const competitorsList = competitors.map((c: CompetitorWithFeatures) => c.name).join(', ');

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
User's Features (normalized and grouped):
${userFeaturesSummary}
Competitors: ${competitorsList}

Determine 10 key parameters to compare these apps on. Parameters should be:
- Specific to this industry/app type
- Measurable or evaluable
- Important to the target audience
- Mix of functional and non-functional (UX, pricing, performance, etc.)

Return as JSON object with "parameters" array:
{
  "parameters": [
    {
      "name": "parameter name (e.g., 'Real-time Collaboration')",
      "description": "what this measures",
      "weight": 0.1
    }
  ]
}

All weights should sum to approximately 1.0.`,
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
 * Score an entity against multiple parameters in a single batch
 * Reduces OpenAI calls from O(Parameters) to O(1) per entity
 */
export async function batchScoreEntity(
  entityName: string,
  entityType: 'user_app' | 'competitor',
  featuresSummary: string,
  parameters: ComparisonParameter[]
): Promise<{ parameterId: string; score: number; reasoning: string }[]> {
  try {
    const parametersList = parameters.map((p, i) =>
      `${i + 1}. ${p.parameterName}: ${p.parameterDescription}`
    ).join('\n');

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
Parameters to score on:
${parametersList}

${entityType === 'user_app' ? 'User\'s features' : 'Competitor features'} (grouped by normalized capabilities):
${featuresSummary}

Score this app on EACH parameter from 0-10:
- 0-3: Poor/Missing
- 4-6: Average/Moderate
- 7-8: Good/Strong
- 9-10: Excellent/Best-in-class

Return JSON with a "scores" array containing an object for each parameter:
{
  "scores": [
    {
      "parameterName": "name from list",
      "score": X.X,
      "reasoning": "brief explanation"
    }
  ]
}`,
        },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0].message.content || '{"scores":[]}';
    const result = JSON.parse(content) as { scores: { parameterName: string; score: number; reasoning: string }[] };
    const scoresMap = new Map(result.scores.map((s) => [s.parameterName, s]));

    return parameters.map(p => {
      const s = scoresMap.get(p.parameterName);
      return {
        parameterId: p.id,
        score: Math.min(10, Math.max(0, s?.score ?? 5.0)),
        reasoning: s?.reasoning || 'Score based on feature analysis',
      };
    });
  } catch (error) {
    console.error(`Error batch scoring ${entityType}:`, error);
    return parameters.map(p => ({
      parameterId: p.id,
      score: 5.0,
      reasoning: 'Default score due to analysis error',
    }));
  }
}

/**
 * DEPRECATED: Use batchScoreEntity instead for better performance
 * Score an entity (user app or competitor) on a specific parameter
 */
export async function scoreEntities(
  parameterName: string,
  parameterDescription: string,
  entityType: 'user_app' | 'competitor',
  entityId: string | null,
  userFeatures: UserFeature[],
  competitorFeatures: CompetitorFeature[],
  analysisId: string
): Promise<FeatureScoreData> {
  try {
    // Fetch normalized groups for this analysis
    const normalizedGroups = await prisma.normalizedFeatureGroup.findMany({
      where: { analysisId },
    });

    // Get normalized feature summary
    const features = entityType === 'user_app'
      ? await getNormalizedFeatureSummary(userFeatures, normalizedGroups)
      : await getNormalizedFeatureSummary(competitorFeatures, normalizedGroups);

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

${entityType === 'user_app' ? 'User\'s features' : 'Competitor features'} (grouped by normalized capabilities):
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
