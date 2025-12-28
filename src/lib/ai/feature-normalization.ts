import OpenAI from 'openai';
import type { UserFeature, CompetitorFeature } from '@/types/database';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface FeatureInput {
  id: string;
  name: string;
  description?: string | null;
  type: 'user' | 'competitor';
}

export interface NormalizedFeatureGroup {
  canonicalName: string;
  description: string;
  featureIds: string[];
}

/**
 * Normalize and group semantically similar features using AI
 * This function identifies when different feature names actually refer to the same capability
 * 
 * Example:
 * - "Schema builder with custom constraints"
 * - "Multiple table management"
 * - "Complex data relationship management"
 * 
 * All would be grouped under a canonical name like "Database Schema & Relationship Management"
 */
export async function normalizeFeatures(
  userFeatures: UserFeature[],
  competitorFeatures: CompetitorFeature[]
): Promise<NormalizedFeatureGroup[]> {
  try {
    // Prepare all features for analysis
    const allFeatures: FeatureInput[] = [
      ...userFeatures.map((f: UserFeature) => ({
        id: f.id,
        name: f.featureName,
        description: f.featureDescription,
        type: 'user' as const,
      })),
      ...competitorFeatures.map((f: CompetitorFeature) => ({
        id: f.id,
        name: f.featureName,
        description: f.featureDescription,
        type: 'competitor' as const,
      })),
    ];

    if (allFeatures.length === 0) {
      return [];
    }

    // Format features for AI analysis
    const featuresList = allFeatures
      .map(
        (f, idx) =>
          `${idx + 1}. [${f.type}] "${f.name}"${f.description ? ` - ${f.description}` : ''}`
      )
      .join('\n');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a product feature analyst expert at identifying when different feature names refer to the same underlying capability.

Your task is to group semantically similar features together, even if they use different terminology.

Examples of features that should be grouped:
- "Schema builder", "Database schema management", "Table structure designer" → "Database Schema Management"
- "Real-time collaboration", "Live editing", "Simultaneous editing" → "Real-time Collaboration"
- "API integration", "Third-party integrations", "External API connections" → "API & Third-party Integrations"
- "User authentication", "Login system", "Account management" → "User Authentication & Account Management"

Guidelines:
1. Group features that represent the SAME core capability, even if worded differently
2. Create a clear, descriptive canonical name for each group
3. Include ALL semantically similar features in the same group
4. Don't over-group - only group features that are truly the same thing
5. Preserve the original feature IDs so they can be mapped back`,
        },
        {
          role: 'user',
          content: `Analyze these features and group semantically similar ones together:

${featuresList}

Return a JSON object with this structure:
{
  "groups": [
    {
      "canonicalName": "Clear, descriptive name for the grouped feature",
      "description": "Brief description of what this feature group represents",
      "featureIndices": [1, 3, 7]  // Array of indices (1-based) from the list above
    }
  ]
}

Important:
- Each feature index should appear in exactly ONE group
- If a feature is truly unique and doesn't match others, it can be in its own group
- Be thorough - look for synonyms, related terms, and different phrasings of the same concept
- The canonical name should be professional and clear`,
        },
      ],
      temperature: 0.3, // Lower temperature for more consistent grouping
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(
      response.choices[0].message.content || '{"groups":[]}'
    );
    const groups = result.groups || [];

    // Map indices back to feature IDs and create normalized groups
    const normalizedGroups: NormalizedFeatureGroup[] = groups.map(
      (group: { canonicalName: string; description: string; featureIndices: number[] }) => {
        const featureIds = group.featureIndices
          .map((idx: number) => {
            // Convert 1-based index to 0-based array index
            const arrayIdx = idx - 1;
            return allFeatures[arrayIdx]?.id;
          })
          .filter((id: string | undefined): id is string => id !== undefined);

        return {
          canonicalName: group.canonicalName,
          description: group.description || '',
          featureIds,
        };
      }
    );

    // Handle features that weren't grouped (shouldn't happen, but safety check)
    const groupedFeatureIds = new Set(
      normalizedGroups.flatMap((g) => g.featureIds)
    );
    const ungroupedFeatures = allFeatures.filter(
      (f) => !groupedFeatureIds.has(f.id)
    );

    // Add ungrouped features as individual groups
    for (const feature of ungroupedFeatures) {
      normalizedGroups.push({
        canonicalName: feature.name,
        description: feature.description || '',
        featureIds: [feature.id],
      });
    }

    return normalizedGroups;
  } catch (error) {
    console.error('Error normalizing features:', error);
    // Fallback: return each feature as its own group
    return [
      ...userFeatures.map((f: UserFeature) => ({
        canonicalName: f.featureName,
        description: f.featureDescription || '',
        featureIds: [f.id],
      })),
      ...competitorFeatures.map((f: CompetitorFeature) => ({
        canonicalName: f.featureName,
        description: f.featureDescription || '',
        featureIds: [f.id],
      })),
    ];
  }
}

/**
 * Get normalized feature groups for display/comparison
 * Returns features grouped by their normalized canonical names
 */
export function getFeaturesByNormalizedGroup<T extends { normalizedGroupId: string | null }>(
  features: T[],
  normalizedGroups: Array<{ id: string; canonicalName: string }>
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();

  for (const feature of features) {
    if (feature.normalizedGroupId) {
      const group = normalizedGroups.find((g: { id: string; canonicalName: string }) => g.id === feature.normalizedGroupId);
      const groupName = group?.canonicalName || 'Uncategorized';
      
      if (!grouped.has(groupName)) {
        grouped.set(groupName, []);
      }
      grouped.get(groupName)!.push(feature);
    } else {
      // Handle features without normalized groups
      if (!grouped.has('Uncategorized')) {
        grouped.set('Uncategorized', []);
      }
      grouped.get('Uncategorized')!.push(feature);
    }
  }

  return grouped;
}

