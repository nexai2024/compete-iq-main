import type { FullAnalysisResponse } from '@/types/api';

export function generateMarkdownReport(data: FullAnalysisResponse): string {
  const {
    analysis,
    userFeatures,
    competitors,
    comparisonParameters,
    featureMatrixScores,
    gapAnalysisItems,
    blueOceanInsight,
    personas,
    positioningData,
    simulatedReviews,
  } = data;

  // Generate date
  const generatedDate = new Date().toLocaleDateString();

  // Start building markdown
  let markdown = `# ${analysis.appName} - Competitive Analysis Report\n\n`;
  markdown += `**Generated:** ${generatedDate}\n`;
  markdown += `**Target Audience:** ${analysis.targetAudience}\n\n`;
  markdown += `## Executive Summary\n\n`;
  markdown += `${analysis.description}\n\n`;
  markdown += `---\n\n`;

  // Market Overview - Competitors
  markdown += `## Market Overview\n\n`;
  markdown += `### Competitors (${competitors.length})\n\n`;
  competitors.forEach((competitor) => {
    markdown += `#### ${competitor.name} - ${competitor.type === 'direct' ? 'Direct' : 'Indirect'}\n\n`;
    markdown += `- **Description:** ${competitor.description}\n`;
    if (competitor.websiteUrl) markdown += `- **Website:** ${competitor.websiteUrl}\n`;
    if (competitor.marketPosition) markdown += `- **Market Position:** ${competitor.marketPosition}\n`;
    if (competitor.pricingModel) markdown += `- **Pricing Model:** ${competitor.pricingModel}\n`;
    if (competitor.foundedYear) markdown += `- **Founded:** ${competitor.foundedYear}\n`;
    markdown += `- **Features:** ${competitor.features.length}\n\n`;
  });

  markdown += `---\n\n`;

  // Feature Comparison Matrix
  markdown += `## Feature Comparison Matrix\n\n`;
  markdown += `| Entity | ${comparisonParameters.map((p) => p.parameterName).join(' | ')} |\n`;
  markdown += `|--------|${comparisonParameters.map(() => '---').join('|')}|\n`;

  // User app row
  markdown += `| **${analysis.appName}** (Your App) | `;
  markdown += comparisonParameters
    .map((param) => {
      const score = featureMatrixScores.find(
        (s) => s.parameterId === param.id && s.entityType === 'user_app'
      );
      return score ? score.score.toFixed(1) : 'N/A';
    })
    .join(' | ');
  markdown += ` |\n`;

  // Competitor rows
  competitors.forEach((competitor) => {
    markdown += `| ${competitor.name} | `;
    markdown += comparisonParameters
      .map((param) => {
        const score = featureMatrixScores.find(
          (s) =>
            s.parameterId === param.id &&
            s.entityType === 'competitor' &&
            s.entityId === competitor.id
        );
        return score ? score.score.toFixed(1) : 'N/A';
      })
      .join(' | ');
    markdown += ` |\n`;
  });

  markdown += `\n*Scores: 0-10 scale*\n\n`;
  markdown += `---\n\n`;

  // Competitive Positioning
  markdown += `## Competitive Positioning\n\n`;
  markdown += `**Value vs Complexity Analysis**\n\n`;

  const userAppPositioning = positioningData.find((p) => p.entityType === 'user_app');
  if (userAppPositioning) {
    markdown += `### Your App\n\n`;
    markdown += `- Value Score: ${userAppPositioning.valueScore}/10\n`;
    markdown += `- Complexity Score: ${userAppPositioning.complexityScore}/10\n`;
    markdown += `- Quadrant: ${userAppPositioning.quadrant}\n\n`;
  }

  markdown += `### Competitors\n\n`;
  positioningData
    .filter((p) => p.entityType === 'competitor')
    .forEach((pos) => {
      markdown += `- **${pos.entityName}:** Value ${pos.valueScore}/10, Complexity ${pos.complexityScore}/10 - ${pos.quadrant}\n`;
    });

  markdown += `\n---\n\n`;

  // Strategic Gaps
  markdown += `## Strategic Gaps\n\n`;

  // MVP Roadmap
  markdown += `### MVP Feature Roadmap\n\n`;

  const p0Features = userFeatures.filter((f) => f.mvpPriority === 'P0');
  const p1Features = userFeatures.filter((f) => f.mvpPriority === 'P1');
  const p2Features = userFeatures.filter((f) => f.mvpPriority === 'P2');

  if (p0Features.length > 0) {
    markdown += `#### P0: Must Have\n\n`;
    p0Features.forEach((feature) => {
      markdown += `- **${feature.featureName}**\n`;
      if (feature.featureDescription)
        markdown += `  - ${feature.featureDescription}\n`;
      if (feature.priorityReasoning)
        markdown += `  - Reasoning: ${feature.priorityReasoning}\n`;
      markdown += `\n`;
    });
  }

  if (p1Features.length > 0) {
    markdown += `#### P1: Should Have\n\n`;
    p1Features.forEach((feature) => {
      markdown += `- **${feature.featureName}**\n`;
      if (feature.featureDescription)
        markdown += `  - ${feature.featureDescription}\n`;
      if (feature.priorityReasoning)
        markdown += `  - Reasoning: ${feature.priorityReasoning}\n`;
      markdown += `\n`;
    });
  }

  if (p2Features.length > 0) {
    markdown += `#### P2: Nice to Have\n\n`;
    p2Features.forEach((feature) => {
      markdown += `- **${feature.featureName}**\n`;
      if (feature.featureDescription)
        markdown += `  - ${feature.featureDescription}\n`;
      if (feature.priorityReasoning)
        markdown += `  - Reasoning: ${feature.priorityReasoning}\n`;
      markdown += `\n`;
    });
  }

  // Competitive Deficits
  const deficits = gapAnalysisItems.filter((g) => g.type === 'deficit');
  if (deficits.length > 0) {
    markdown += `### Competitive Deficits\n\n`;
    deficits.forEach((deficit) => {
      markdown += `#### ${deficit.title} - ${deficit.severity}\n\n`;
      markdown += `${deficit.description}\n\n`;
      const affectedCompetitors = deficit.affectedCompetitors as string[];
      if (affectedCompetitors && affectedCompetitors.length > 0) {
        markdown += `**Affected by:** ${affectedCompetitors.join(', ')}\n\n`;
      }
      markdown += `**Recommendation:** ${deficit.recommendation}\n\n`;
    });
  }

  // Unique Standouts
  const standouts = gapAnalysisItems.filter((g) => g.type === 'standout');
  if (standouts.length > 0) {
    markdown += `### Unique Standouts\n\n`;
    standouts.forEach((standout) => {
      markdown += `#### ${standout.title} - Opportunity Score: ${standout.opportunityScore}/100\n\n`;
      markdown += `${standout.description}\n\n`;
      markdown += `**Recommendation:** ${standout.recommendation}\n\n`;
    });
  }

  // Blue Ocean Opportunity
  if (blueOceanInsight) {
    markdown += `### Blue Ocean Opportunity\n\n`;
    markdown += `**${blueOceanInsight.marketVacuumTitle}**\n\n`;
    markdown += `${blueOceanInsight.description}\n\n`;
    const supportingEvidence = blueOceanInsight.supportingEvidence as string[];
    if (supportingEvidence && supportingEvidence.length > 0) {
      markdown += `**Supporting Evidence:**\n\n`;
      supportingEvidence.forEach((evidence) => {
        markdown += `- ${evidence}\n`;
      });
      markdown += `\n`;
    }
    markdown += `**Target Segment:** ${blueOceanInsight.targetSegment}\n\n`;
    markdown += `**Estimated Opportunity:** ${blueOceanInsight.estimatedOpportunity}\n\n`;
    markdown += `**Implementation Difficulty:** ${blueOceanInsight.implementationDifficulty}\n\n`;
    markdown += `**Strategic Recommendation:**\n\n`;
    markdown += `${blueOceanInsight.strategicRecommendation}\n\n`;
  }

  markdown += `---\n\n`;

  // Simulated User Feedback
  markdown += `## Simulated User Feedback\n\n`;
  simulatedReviews.forEach((review) => {
    markdown += `### ${review.reviewerName} - ${review.rating}⭐\n\n`;
    markdown += `**Profile:** ${review.reviewerProfile}\n\n`;
    markdown += `**Sentiment:** ${review.sentiment}\n\n`;
    markdown += `${review.reviewText}\n\n`;
    const highlightedFeatures = review.highlightedFeatures as string[];
    if (highlightedFeatures && highlightedFeatures.length > 0) {
      markdown += `**Highlighted Features:** ${highlightedFeatures.join(', ')}\n\n`;
    }
    const painPointsAddressed = review.painPointsAddressed as string[];
    if (painPointsAddressed && painPointsAddressed.length > 0) {
      markdown += `**Pain Points Addressed:** ${painPointsAddressed.join(', ')}\n\n`;
    }
  });

  markdown += `---\n\n`;

  // Personas
  markdown += `## Personas\n\n`;
  personas.forEach((persona) => {
    markdown += `### ${persona.name} - ${persona.title}\n\n`;
    markdown += `**Type:** ${persona.personaType}\n\n`;
    markdown += `**Description:** ${persona.description}\n\n`;

    const painPoints = persona.painPoints as string[];
    if (painPoints && painPoints.length > 0) {
      markdown += `**Pain Points:**\n\n`;
      painPoints.forEach((point) => {
        markdown += `- ${point}\n`;
      });
      markdown += `\n`;
    }

    const priorities = persona.priorities as string[];
    if (priorities && priorities.length > 0) {
      markdown += `**Priorities:**\n\n`;
      priorities.forEach((priority) => {
        markdown += `- ${priority}\n`;
      });
      markdown += `\n`;
    }

    markdown += `**Behavior Profile:**\n\n`;
    markdown += `${persona.behaviorProfile}\n\n`;
  });

  markdown += `---\n\n`;
  markdown += `*Report generated by CompeteIQ - Competitive Intelligence Platform*\n\n`;
  markdown += `*Analysis ID: ${analysis.id}*\n`;

  return markdown;
}
