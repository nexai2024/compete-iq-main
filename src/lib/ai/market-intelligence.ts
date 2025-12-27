import OpenAI from 'openai';
import type { Analysis, UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { MarketIntelligenceData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate comprehensive market intelligence
 * Provides industry insights, market dynamics, and strategic recommendations
 */
export async function generateMarketIntelligence(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<MarketIntelligenceData> {
  try {
    const competitorsSummary = competitors
      .map((c) => {
        const features = c.features.map((f) => f.featureName).join(', ');
        return `${c.name} (${c.type}): ${c.description || 'No description'}. Features: ${features || 'N/A'}. Market Position: ${c.marketPosition || 'N/A'}. Pricing: ${c.pricingModel || 'N/A'}`;
      })
      .join('\n\n');

    const userFeaturesSummary = analysis.userFeatures
      .map((f) => `${f.featureName}: ${f.featureDescription || 'No description'}`)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You are a senior market intelligence analyst with expertise in competitive analysis, industry trends, and strategic planning. Provide comprehensive, actionable market intelligence.',
        },
        {
          role: 'user',
          content: `Generate comprehensive market intelligence for this app idea:

APP DETAILS:
- Name: ${analysis.appName}
- Target Audience: ${analysis.targetAudience}
- Description: ${analysis.description}
- Planned Features:
${userFeaturesSummary}

COMPETITIVE LANDSCAPE:
${competitorsSummary || 'No competitors identified yet'}

Provide comprehensive market intelligence covering:

1. INDUSTRY OVERVIEW (3-4 paragraphs)
   - Current state of the industry
   - Key players and market structure
   - Industry maturity and evolution

2. MARKET SIZE & GROWTH
   - Estimated market size (if available/estimatable)
   - Growth trends and projections
   - Market segments and their sizes

3. MARKET TRENDS (5-7 key trends)
   - Emerging technologies
   - Consumer behavior shifts
   - Regulatory changes
   - Industry disruptions

4. COMPETITIVE LANDSCAPE (detailed analysis)
   - Market concentration (fragmented, oligopoly, monopoly)
   - Competitive intensity
   - Market share distribution
   - Competitive positioning strategies

5. MARKET DYNAMICS
   - Market drivers (what's pushing growth)
   - Market restraints (what's limiting growth)
   - Market opportunities (untapped areas)

6. BARRIERS TO ENTRY
   - Overall level (low/medium/high/very_high)
   - Specific factors (capital requirements, regulations, network effects, etc.)

7. OPPORTUNITIES (3-5 specific opportunities)
   - Title, description, and potential impact

8. THREATS (3-5 specific threats)
   - Title, description, severity, and mitigation strategies

9. STRATEGIC RECOMMENDATIONS (comprehensive strategic advice)
   - Market entry strategy
   - Competitive positioning
   - Growth strategies
   - Risk mitigation

10. KEY SUCCESS FACTORS (5-7 factors)
    - What it takes to succeed in this market

Return as JSON:
{
  "industry_overview": "detailed overview text",
  "market_size": "estimated size and context",
  "market_growth": "growth rate and projections",
  "market_trends": ["trend 1", "trend 2", ...],
  "competitive_landscape": "detailed analysis text",
  "market_dynamics": {
    "drivers": ["driver 1", "driver 2", ...],
    "restraints": ["restraint 1", "restraint 2", ...],
    "opportunities": ["opportunity 1", "opportunity 2", ...]
  },
  "barriers_to_entry": {
    "level": "low|medium|high|very_high",
    "factors": ["factor 1", "factor 2", ...]
  },
  "opportunities": [
    {
      "title": "opportunity title",
      "description": "detailed description",
      "potential_impact": "low|medium|high|very_high"
    }
  ],
  "threats": [
    {
      "title": "threat title",
      "description": "detailed description",
      "severity": "low|medium|high|critical",
      "mitigation": "how to mitigate"
    }
  ],
  "strategic_recommendations": "comprehensive strategic advice text",
  "key_success_factors": ["factor 1", "factor 2", ...]
}`,
        },
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and provide defaults
    return {
      industry_overview:
        result.industry_overview ||
        'Industry analysis is being generated. This will provide comprehensive insights into the market landscape.',
      market_size: result.market_size || undefined,
      market_growth: result.market_growth || undefined,
      market_trends: result.market_trends || [],
      competitive_landscape:
        result.competitive_landscape ||
        'Competitive landscape analysis is being generated. This will detail market concentration and competitive dynamics.',
      market_dynamics: result.market_dynamics || {
        drivers: [],
        restraints: [],
        opportunities: [],
      },
      barriers_to_entry: result.barriers_to_entry || {
        level: 'medium',
        factors: [],
      },
      opportunities: result.opportunities || [],
      threats: result.threats || [],
      strategic_recommendations:
        result.strategic_recommendations ||
        'Strategic recommendations are being generated. This will provide actionable advice for market entry and growth.',
      key_success_factors: result.key_success_factors || [],
    };
  } catch (error) {
    console.error('Error generating market intelligence:', error);
    // Return default structure on error
    return {
      industry_overview:
        'Unable to generate industry overview at this time. Please try again later.',
      competitive_landscape:
        'Unable to generate competitive landscape analysis at this time. Please try again later.',
      strategic_recommendations:
        'Unable to generate strategic recommendations at this time. Please try again later.',
    };
  }
}

