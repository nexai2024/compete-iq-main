import OpenAI from 'openai';
import type { Analysis, UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { DeficitData, StandoutData, BlueOceanData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GapAnalysisResult {
  deficits: DeficitData[];
  standouts: StandoutData[];
}

/**
 * Analyze gaps between user features and competitor features
 */
export async function analyzeGaps(
  userFeatures: UserFeature[],
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<GapAnalysisResult> {
  try {
    const userFeaturesList = userFeatures
      .map((f) => `- ${f.featureName}${f.featureDescription ? `: ${f.featureDescription}` : ''}`)
      .join('\n');

    const competitorFeaturesList = competitors
      .map((c) => `${c.name}:\n${c.features.map((f) => `  - ${f.featureName}`).join('\n')}`)
      .join('\n\n');

    // Identify deficits
    const deficitsResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic product analyst. Identify feature gaps and competitive deficits.',
        },
        {
          role: 'user',
          content: `User's Planned Features:
${userFeaturesList}

Competitor Features (aggregated from all competitors):
${competitorFeaturesList}

Identify 3-5 significant DEFICITS - features that competitors have that the user is missing.

For each deficit:
- title: Brief name
- description: Why this matters
- affected_competitors: Array of competitor names that have this
- severity: critical|high|medium|low (based on how many competitors have it and importance)
- recommendation: What user should do about it

Focus on:
- Features that 3+ competitors offer (table stakes)
- Features critical to target audience
- Features that create competitive disadvantage

Return JSON object with "deficits" array.`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const deficitsResult = JSON.parse(deficitsResponse.choices[0].message.content || '{"deficits":[]}');

    // Identify standouts
    const standoutsResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a strategic product analyst. Identify unique value propositions and standout features.',
        },
        {
          role: 'user',
          content: `User's Planned Features:
${userFeaturesList}

Competitor Features:
${competitorFeaturesList}

Identify 2-4 STANDOUTS - unique features or approaches the user has that competitors lack.

For each standout:
- title: Brief name
- description: Why this is valuable
- opportunity_score: 0-10 (potential competitive advantage)
- recommendation: How to leverage this uniqueness

Focus on:
- Truly unique capabilities
- Novel approaches to common problems
- Underserved user needs addressed

Return JSON object with "standouts" array.`,
        },
      ],
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const standoutsResult = JSON.parse(standoutsResponse.choices[0].message.content || '{"standouts":[]}');

    return {
      deficits: deficitsResult.deficits || [],
      standouts: standoutsResult.standouts || [],
    };
  } catch (error) {
    console.error('Error analyzing gaps:', error);
    return {
      deficits: [],
      standouts: [],
    };
  }
}

/**
 * Discover Blue Ocean opportunity
 */
export async function discoverBlueOcean(
  analysis: Analysis,
  competitors: (Competitor & { features: CompetitorFeature[] })[],
  gapAnalysis: GapAnalysisResult
): Promise<BlueOceanData> {
  try {
    const competitorsSummary = competitors
      .map((c) => `${c.name}: ${c.description || 'No description'}`)
      .join('\n');

    const deficitsSummary = gapAnalysis.deficits
      .map((d) => `- ${d.title} (${d.severity}): ${d.description}`)
      .join('\n');

    const standoutsSummary = gapAnalysis.standouts
      .map((s) => `- ${s.title} (score: ${s.opportunity_score}): ${s.description}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a Blue Ocean strategy expert. Identify untapped market opportunities.',
        },
        {
          role: 'user',
          content: `Market Context:
User's App: ${analysis.appName} targeting ${analysis.targetAudience}

Competitors:
${competitorsSummary}

Deficits Identified:
${deficitsSummary}

Standouts Identified:
${standoutsSummary}

Based on this analysis, identify ONE specific "Blue Ocean" opportunity:
- A market vacuum or underserved need
- Based on competitor weaknesses or gaps
- Aligned with user's planned features or easily achievable
- Has viable commercial potential

Return JSON:
{
  "market_vacuum_title": "concise title",
  "description": "detailed explanation of opportunity",
  "supporting_evidence": ["data point 1", "data point 2", "..."],
  "target_segment": "specific audience segment",
  "estimated_opportunity": "low|medium|high|very_high",
  "implementation_difficulty": "easy|moderate|hard|very_hard",
  "strategic_recommendation": "specific actionable advice"
}`,
        },
      ],
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      market_vacuum_title: result.market_vacuum_title || 'Market Opportunity',
      description: result.description || 'An opportunity exists in this market space.',
      supporting_evidence: result.supporting_evidence || [],
      target_segment: result.target_segment || analysis.targetAudience,
      estimated_opportunity: result.estimated_opportunity || 'medium',
      implementation_difficulty: result.implementation_difficulty || 'moderate',
      strategic_recommendation: result.strategic_recommendation || 'Focus on differentiation.',
    };
  } catch (error) {
    console.error('Error discovering Blue Ocean:', error);
    return {
      market_vacuum_title: 'Market Analysis',
      description: 'Further market research recommended to identify specific opportunities.',
      supporting_evidence: [],
      target_segment: analysis.targetAudience,
      estimated_opportunity: 'medium',
      implementation_difficulty: 'moderate',
      strategic_recommendation: 'Conduct additional market research to identify opportunities.',
    };
  }
}
