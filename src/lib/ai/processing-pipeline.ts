import { prisma } from '@/lib/db/prisma';
import { searchCompetitors, enrichCompetitorData } from './competitor-search';
import { generateComparisonParameters, scoreEntities } from './feature-analysis';
import { analyzeGaps, discoverBlueOcean } from './gap-analysis';
import { prioritizeFeatures } from './mvp-scoper';
import { generatePersonas, generateSimulatedReviews } from './persona-generator';
import { generatePositioningData } from './positioning-map';
import { generateMarketIntelligence } from './market-intelligence';
import { normalizeFeatures } from './feature-normalization';

/**
 * Main AI processing pipeline
 * Orchestrates all stages of analysis
 */
export async function processAnalysis(analysisId: string): Promise<void> {
  console.log(`Starting processing for analysis ${analysisId}`);

  try {
    // Fetch analysis data
    const analysis = await prisma.analysis.findUnique({
      where: { id: analysisId },
      include: {
        userFeatures: {
          orderBy: { orderIndex: 'asc' },
        },
      },
    });

    if (!analysis) {
      throw new Error('Analysis not found');
    }

    // Stage 1: Competitor Identification
    await updateStage(analysisId, 'competitors');
    const competitors = await searchCompetitors(analysis);

    // Save competitors to database
    const savedCompetitors = await Promise.all(
      competitors.map((competitor, index) =>
        prisma.competitor.create({
          data: {
            analysisId,
            name: competitor.name,
            type: competitor.type,
            description: competitor.description,
            websiteUrl: competitor.website_url,
            marketPosition: competitor.market_position,
            pricingModel: competitor.pricing_model,
            foundedYear: competitor.founded_year,
            orderIndex: index,
          },
        })
      )
    );

    // Enrich competitor data with features
    for (const competitor of savedCompetitors) {
      const enrichedData = await enrichCompetitorData(competitor.name, competitor.description || '');

      await prisma.competitorFeature.createMany({
        data: enrichedData.features.map((feature) => ({
          competitorId: competitor.id,
          featureName: feature.name,
          featureDescription: feature.description,
          featureCategory: feature.category,
          isPaid: feature.is_paid,
        })),
      });

      // Update competitor with enriched data
      await prisma.competitor.update({
        where: { id: competitor.id },
        data: {
          foundedYear: enrichedData.founded_year || competitor.foundedYear,
          marketPosition: enrichedData.market_position || competitor.marketPosition,
        },
      });
    }

    await updateStage(analysisId, 'competitors_complete');

    // Stage 1.5: Feature Normalization - Group semantically similar features
    await updateStage(analysisId, 'normalizing_features');

    // Fetch all features (user + competitor) for normalization
    const allUserFeatures = await prisma.userFeature.findMany({
      where: { analysisId },
    });

    const allCompetitorFeatures = await prisma.competitorFeature.findMany({
      where: {
        competitor: {
          analysisId,
        },
      },
    });

    // Normalize features using AI
    const normalizedGroups = await normalizeFeatures(
      allUserFeatures,
      allCompetitorFeatures
    );

    // Save normalized groups to database
    const savedNormalizedGroups = await Promise.all(
      normalizedGroups.map((group) =>
        prisma.normalizedFeatureGroup.create({
          data: {
            analysisId,
            canonicalName: group.canonicalName,
            description: group.description,
          },
        })
      )
    );

    // Create a map of feature ID to normalized group ID
    const featureToGroupMap = new Map<string, string>();
    for (let i = 0; i < normalizedGroups.length; i++) {
      const group = normalizedGroups[i];
      const savedGroup = savedNormalizedGroups[i];
      for (const featureId of group.featureIds) {
        featureToGroupMap.set(featureId, savedGroup.id);
      }
    }

    // Update user features with normalized group IDs
    for (const userFeature of allUserFeatures) {
      const normalizedGroupId = featureToGroupMap.get(userFeature.id);
      if (normalizedGroupId) {
        await prisma.userFeature.update({
          where: { id: userFeature.id },
          data: { normalizedGroupId },
        });
      }
    }

    // Update competitor features with normalized group IDs
    for (const competitorFeature of allCompetitorFeatures) {
      const normalizedGroupId = featureToGroupMap.get(competitorFeature.id);
      if (normalizedGroupId) {
        await prisma.competitorFeature.update({
          where: { id: competitorFeature.id },
          data: { normalizedGroupId },
        });
      }
    }

    // Stage 2: Feature Analysis & Matrix Generation
    await updateStage(analysisId, 'features');

    // Fetch complete competitor data with features (now with normalized groups)
    const competitorsWithFeatures = await prisma.competitor.findMany({
      where: { analysisId },
      include: { features: true },
    });

    // Generate comparison parameters
    const parameters = await generateComparisonParameters(analysis, competitorsWithFeatures);

    // Save parameters to database
    const savedParameters = await Promise.all(
      parameters.map((param, index) =>
        prisma.comparisonParameter.create({
          data: {
            analysisId,
            parameterName: param.name,
            parameterDescription: param.description,
            weight: param.weight,
            orderIndex: index,
          },
        })
      )
    );

    // Score each entity for each parameter
    const totalScores = savedParameters.length * (1 + competitorsWithFeatures.length);
    let completedScores = 0;

    for (const parameter of savedParameters) {
      // Score user's app
      const userScore = await scoreEntities(
        parameter.parameterName,
        parameter.parameterDescription || '',
        'user_app',
        null,
        analysis.userFeatures,
        [],
        analysisId
      );

      await prisma.featureMatrixScore.create({
        data: {
          analysisId,
          parameterId: parameter.id,
          entityType: 'user_app',
          entityId: null,
          score: userScore.score,
          reasoning: userScore.reasoning,
        },
      });

      completedScores++;
      if (completedScores % 10 === 0) {
        await updateStage(analysisId, `matrix_progress_${completedScores}/${totalScores}`);
      }

      // Score each competitor
      for (const competitor of competitorsWithFeatures) {
        const competitorScore = await scoreEntities(
          parameter.parameterName,
          parameter.parameterDescription || '',
          'competitor',
          competitor.id,
          [],
          competitor.features,
          analysisId
        );

        await prisma.featureMatrixScore.create({
          data: {
            analysisId,
            parameterId: parameter.id,
            entityType: 'competitor',
            entityId: competitor.id,
            score: competitorScore.score,
            reasoning: competitorScore.reasoning,
          },
        });

        completedScores++;
        if (completedScores % 10 === 0) {
          await updateStage(analysisId, `matrix_progress_${completedScores}/${totalScores}`);
        }
      }
    }

    await updateStage(analysisId, 'matrix_complete');

    // Stage 3: Gap Analysis & Blue Ocean Discovery
    await updateStage(analysisId, 'gaps');

    const gapAnalysisResult = await analyzeGaps(analysis.userFeatures, competitorsWithFeatures);

    // Save deficits
    await Promise.all(
      gapAnalysisResult.deficits.map((deficit, index) =>
        prisma.gapAnalysisItem.create({
          data: {
            analysisId,
            type: 'deficit',
            title: deficit.title,
            description: deficit.description,
            affectedCompetitors: deficit.affected_competitors,
            severity: deficit.severity,
            recommendation: deficit.recommendation,
            orderIndex: index,
          },
        })
      )
    );

    // Save standouts
    await Promise.all(
      gapAnalysisResult.standouts.map((standout, index) =>
        prisma.gapAnalysisItem.create({
          data: {
            analysisId,
            type: 'standout',
            title: standout.title,
            description: standout.description,
            opportunityScore: standout.opportunity_score,
            recommendation: standout.recommendation,
            orderIndex: index,
          },
        })
      )
    );

    // Discover Blue Ocean opportunity
    const blueOcean = await discoverBlueOcean(analysis, competitorsWithFeatures, gapAnalysisResult);

    await prisma.blueOceanInsight.create({
      data: {
        analysisId,
        marketVacuumTitle: blueOcean.market_vacuum_title,
        description: blueOcean.description,
        supportingEvidence: blueOcean.supporting_evidence,
        targetSegment: blueOcean.target_segment,
        estimatedOpportunity: blueOcean.estimated_opportunity,
        implementationDifficulty: blueOcean.implementation_difficulty,
        strategicRecommendation: blueOcean.strategic_recommendation,
      },
    });

    await updateStage(analysisId, 'gaps_complete');

    // Stage 4: MVP Scoping
    await updateStage(analysisId, 'mvp');

    const mvpPriorities = await prioritizeFeatures(
      analysis.userFeatures,
      competitorsWithFeatures,
      gapAnalysisResult
    );

    // Update user features with priorities
    await Promise.all(
      mvpPriorities.map((priority) =>
        prisma.userFeature.update({
          where: { id: priority.feature_id },
          data: {
            mvpPriority: priority.priority,
            priorityReasoning: priority.reasoning,
          },
        })
      )
    );

    await updateStage(analysisId, 'mvp_complete');

    // Stage 5: Persona Generation & Simulated Reviews
    await updateStage(analysisId, 'personas');

    const personas = await generatePersonas(analysis);

    // Save personas
    await Promise.all(
      personas.map((persona, index) =>
        prisma.persona.create({
          data: {
            analysisId,
            personaType: persona.persona_type,
            name: persona.name,
            title: persona.title,
            description: persona.description,
            painPoints: persona.pain_points,
            priorities: persona.priorities,
            behaviorProfile: persona.behavior_profile,
            systemPrompt: persona.system_prompt,
            orderIndex: index + 1,
          },
        })
      )
    );

    // Generate simulated reviews
    const reviews = await generateSimulatedReviews(analysis, competitorsWithFeatures);

    await prisma.simulatedReview.createMany({
      data: reviews.map((review) => ({
        analysisId,
        reviewerName: review.reviewer_name,
        reviewerProfile: review.reviewer_profile,
        rating: review.rating,
        reviewText: review.review_text,
        sentiment: review.sentiment,
        highlightedFeatures: review.highlighted_features,
        painPointsAddressed: review.pain_points_addressed,
      })),
    });

    await updateStage(analysisId, 'personas_complete');

    // Stage 6: Positioning Map Generation
    await updateStage(analysisId, 'positioning');

    const positioningData = await generatePositioningData(analysis, competitorsWithFeatures);

    await prisma.positioningData.createMany({
      data: positioningData.map((position) => ({
        analysisId,
        entityType: position.entity_type,
        entityId: position.entity_id,
        entityName: position.entity_name,
        valueScore: position.value_score,
        complexityScore: position.complexity_score,
        reasoning: position.reasoning,
        quadrant: determineQuadrant(position.value_score, position.complexity_score),
      })),
    });

    await updateStage(analysisId, 'positioning_complete');

    // Stage 7: Market Intelligence
    await updateStage(analysisId, 'market_intelligence');

    const marketIntelligence = await generateMarketIntelligence(analysis, competitorsWithFeatures);

    await prisma.marketIntelligence.create({
      data: {
        analysisId,
        industryOverview: marketIntelligence.industry_overview,
        marketSize: marketIntelligence.market_size ?? undefined,
        marketGrowth: marketIntelligence.market_growth ?? undefined,
        marketTrends: marketIntelligence.market_trends ?? undefined,
        competitiveLandscape: marketIntelligence.competitive_landscape ?? undefined,
        marketDynamics: marketIntelligence.market_dynamics ?? undefined,
        barriersToEntry: marketIntelligence.barriers_to_entry ?? undefined,
        opportunities: marketIntelligence.opportunities ?? undefined,
        threats: marketIntelligence.threats ?? undefined,
        strategicRecommendations: marketIntelligence.strategic_recommendations ?? undefined,
        keySuccessFactors: marketIntelligence.key_success_factors ?? undefined,
      },
    });

    await updateStage(analysisId, 'market_intelligence_complete');

    // Stage 8: Finalization
    await updateStage(analysisId, 'complete');

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'completed',
        aiProcessingStage: 'complete',
      },
    });

    console.log(`Analysis ${analysisId} completed successfully`);
  } catch (error) {
    console.error(`Error processing analysis ${analysisId}:`, error);

    await prisma.analysis.update({
      where: { id: analysisId },
      data: {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    });

    throw error;
  }
}

/**
 * Update processing stage
 */
async function updateStage(analysisId: string, stage: string): Promise<void> {
  await prisma.analysis.update({
    where: { id: analysisId },
    data: { aiProcessingStage: stage },
  });
}

/**
 * Determine quadrant based on value and complexity scores
 */
function determineQuadrant(valueScore: number, complexityScore: number): string {
  if (valueScore >= 7 && complexityScore < 5) {
    return 'High Value, Low Complexity (Sweet Spot)';
  } else if (valueScore >= 7 && complexityScore >= 5) {
    return 'High Value, High Complexity (Feature Rich)';
  } else if (valueScore < 7 && complexityScore < 5) {
    return 'Low Value, Low Complexity (Basic Tools)';
  } else {
    return 'Low Value, High Complexity (Bloated)';
  }
}
