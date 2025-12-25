import OpenAI from 'openai';
import type { Analysis, UserFeature, Competitor, CompetitorFeature } from '@/types/database';
import type { PersonaData, SimulatedReviewData } from '@/types/analysis';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate 3 AI personas for testing
 */
export async function generatePersonas(
  analysis: Analysis & { userFeatures: UserFeature[] }
): Promise<PersonaData[]> {
  const personaTypes: Array<'price_sensitive' | 'power_user' | 'corporate_buyer'> = [
    'price_sensitive',
    'power_user',
    'corporate_buyer',
  ];

  const personas: PersonaData[] = [];

  for (const personaType of personaTypes) {
    try {
      const userFeaturesSummary = analysis.userFeatures
        .map((f) => f.featureName)
        .join(', ');

      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a UX researcher creating user personas.',
          },
          {
            role: 'user',
            content: `Create a detailed ${personaType.replace('_', ' ')} persona for:
App: ${analysis.appName}
Target Audience: ${analysis.targetAudience}
Features: ${userFeaturesSummary}

Generate:
- name: Memorable persona name (e.g., "Budget-Conscious Beth")
- title: Job title/role
- description: 2-3 paragraph backstory and characteristics
- pain_points: Array of 4-5 specific pain points they face
- priorities: Array of what matters most to them (e.g., ["price", "ease of use", "scalability"])
- behavior_profile: How they research, evaluate, and buy software

Also create a system_prompt for AI chat simulation:
- Written in second person ("You are...")
- Captures personality, priorities, objections, questions they'd ask
- Realistic and grounded in this persona type
- Should be detailed enough to guide conversations

Return JSON.`,
          },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');

      personas.push({
        persona_type: personaType,
        name: result.name || `${personaType} Persona`,
        title: result.title || 'User',
        description: result.description || 'A typical user persona',
        pain_points: result.pain_points || [],
        priorities: result.priorities || [],
        behavior_profile: result.behavior_profile || 'Standard user behavior',
        system_prompt: result.system_prompt || generateDefaultSystemPrompt(personaType, analysis.appName),
      });
    } catch (error) {
      console.error(`Error generating ${personaType} persona:`, error);
      personas.push(getDefaultPersona(personaType, analysis.appName));
    }
  }

  return personas;
}

/**
 * Generate simulated user reviews
 */
export async function generateSimulatedReviews(
  analysis: Analysis & { userFeatures: UserFeature[] },
  competitors: (Competitor & { features: CompetitorFeature[] })[]
): Promise<SimulatedReviewData[]> {
  try {
    const userFeaturesList = analysis.userFeatures
      .map((f) => f.featureName)
      .join(', ');

    const competitorsSummary = competitors
      .map((c) => `${c.name}: ${c.description}`)
      .slice(0, 3)
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are simulating realistic user reviews for a new app based on market research.',
        },
        {
          role: 'user',
          content: `App: ${analysis.appName}
Description: ${analysis.description}
Features: ${userFeaturesList}
Target Audience: ${analysis.targetAudience}

Market Context (top competitors):
${competitorsSummary}

Generate 10 realistic user reviews (mix of ratings):
- 4 positive reviews (4-5 stars)
- 4 mixed reviews (3 stars)
- 2 negative reviews (1-2 stars)

Base reviews on:
- Real pain points from competitor analysis
- How user features address (or don't address) those needs
- Realistic expectations for this type of app
- Target audience priorities and concerns

For each review:
- reviewer_name: Realistic name
- reviewer_profile: Brief descriptor (e.g., "Small business owner", "Freelance designer")
- rating: 1-5 stars
- review_text: 2-4 sentences, realistic tone
- sentiment: positive|mixed|negative
- highlighted_features: Array of feature names mentioned
- pain_points_addressed: Array of pain points referenced

Make reviews feel authentic - not overly promotional, include realistic concerns.

Return JSON object with "reviews" array.`,
        },
      ],
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(response.choices[0].message.content || '{"reviews":[]}');
    return result.reviews || [];
  } catch (error) {
    console.error('Error generating simulated reviews:', error);
    return [];
  }
}

/**
 * Generate default system prompt for persona
 */
function generateDefaultSystemPrompt(personaType: string, appName: string): string {
  const prompts = {
    price_sensitive: `You are a price-sensitive user evaluating ${appName}. You are very budget-conscious and always looking for the best value. You prioritize cost over features and are skeptical of premium pricing. You compare prices extensively and ask about free tiers, discounts, and alternatives. Be realistic about budget constraints and express concerns about ongoing costs.`,
    power_user: `You are a power user evaluating ${appName}. You are technically savvy and demand advanced features, customization options, and robust functionality. You ask detailed questions about capabilities, integrations, API access, and scalability. You're willing to pay for quality but expect excellence. You're critical of limitations and missing features.`,
    corporate_buyer: `You are a corporate buyer evaluating ${appName} for your organization. You focus on enterprise features like security, compliance, admin controls, scalability, and support. You ask about SSO, data privacy, SLAs, onboarding, and vendor stability. You need to justify the purchase to stakeholders and require clear ROI.`,
  };

  return prompts[personaType as keyof typeof prompts] || prompts.price_sensitive;
}

/**
 * Get default persona as fallback
 */
function getDefaultPersona(personaType: 'price_sensitive' | 'power_user' | 'corporate_buyer', appName: string): PersonaData {
  const defaults = {
    price_sensitive: {
      name: 'Budget-Conscious Beth',
      title: 'Freelance Designer',
      description: 'Beth is a freelance designer who carefully manages her tool budget. She looks for affordable solutions that provide good value.',
      pain_points: ['Limited budget', 'Need cost-effective tools', 'Concerned about subscription fatigue'],
      priorities: ['price', 'value', 'essential features'],
    },
    power_user: {
      name: 'Tech-Savvy Tom',
      title: 'Senior Developer',
      description: 'Tom is an experienced developer who demands powerful features and customization. He values efficiency and advanced capabilities.',
      pain_points: ['Limited by basic tools', 'Need advanced features', 'Want automation and integrations'],
      priorities: ['functionality', 'customization', 'integrations', 'performance'],
    },
    corporate_buyer: {
      name: 'Corporate Carol',
      title: 'IT Manager',
      description: 'Carol evaluates software for her organization. She focuses on security, compliance, and enterprise features.',
      pain_points: ['Need enterprise security', 'Compliance requirements', 'Team management complexity'],
      priorities: ['security', 'compliance', 'support', 'scalability', 'ROI'],
    },
  };

  const defaultData = defaults[personaType];

  return {
    persona_type: personaType,
    name: defaultData.name,
    title: defaultData.title,
    description: defaultData.description,
    pain_points: defaultData.pain_points,
    priorities: defaultData.priorities,
    behavior_profile: 'Thorough researcher who evaluates multiple options before making a decision.',
    system_prompt: generateDefaultSystemPrompt(personaType, appName),
  };
}
