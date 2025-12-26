import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { FullAnalysisResponse } from '@/types/api';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#666',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
    fontWeight: 'bold',
    borderBottom: '2pt solid #3b82f6',
    paddingBottom: 5,
  },
  subsectionTitle: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  text: {
    marginBottom: 5,
    lineHeight: 1.5,
  },
  listItem: {
    marginBottom: 3,
    marginLeft: 10,
  },
  table: {
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1pt solid #ddd',
  },
  tableCell: {
    padding: 5,
    flex: 1,
  },
  badge: {
    backgroundColor: '#3b82f6',
    color: 'white',
    padding: '3pt 8pt',
    borderRadius: 3,
    fontSize: 9,
    marginRight: 5,
  },
});

export const AnalysisPDFDocument = ({ data }: { data: FullAnalysisResponse }) => {
  const { analysis, competitors, userFeatures, gapAnalysisItems, blueOceanInsight, personas } =
    data;

  const deficits = gapAnalysisItems.filter((g) => g.type === 'deficit');
  const standouts = gapAnalysisItems.filter((g) => g.type === 'standout');

  return (
    <Document>
      {/* Page 1: Cover & Executive Summary */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>{analysis.appName}</Text>
          <Text style={styles.subtitle}>Competitive Analysis Report</Text>
          <Text style={styles.text}>Generated: {new Date().toLocaleDateString()}</Text>
          <Text style={styles.text}>Target Audience: {analysis.targetAudience}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Executive Summary</Text>
          <Text style={styles.text}>{analysis.description}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          <Text style={styles.text}>• Competitors Analyzed: {competitors.length}</Text>
          <Text style={styles.text}>• Features Evaluated: {userFeatures.length}</Text>
          <Text style={styles.text}>• Competitive Deficits: {deficits.length}</Text>
          <Text style={styles.text}>• Unique Standouts: {standouts.length}</Text>
        </View>
      </Page>

      {/* Page 2: Competitors */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competitor Landscape</Text>
          {competitors.map((competitor) => (
            <View key={competitor.id} style={{ marginBottom: 15 }}>
              <Text style={styles.subsectionTitle}>
                {competitor.name} ({competitor.type === 'direct' ? 'Direct' : 'Indirect'})
              </Text>
              <Text style={styles.text}>{competitor.description}</Text>
              {competitor.websiteUrl && (
                <Text style={styles.text}>Website: {competitor.websiteUrl}</Text>
              )}
              {competitor.marketPosition && (
                <Text style={styles.text}>Position: {competitor.marketPosition}</Text>
              )}
              {competitor.pricingModel && (
                <Text style={styles.text}>Pricing: {competitor.pricingModel}</Text>
              )}
              <Text style={styles.text}>Features: {competitor.features.length}</Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 3: Strategic Gaps - MVP Roadmap */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MVP Feature Roadmap</Text>

          {/* P0 Features */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subsectionTitle}>
              P0: Must Have ({userFeatures.filter((f) => f.mvpPriority === 'P0').length})
            </Text>
            {userFeatures
              .filter((f) => f.mvpPriority === 'P0')
              .map((feature) => (
                <View key={feature.id} style={styles.listItem}>
                  <Text style={styles.text}>• {feature.featureName}</Text>
                  {feature.featureDescription && (
                    <Text style={{ fontSize: 10, marginLeft: 10, color: '#666' }}>
                      {feature.featureDescription}
                    </Text>
                  )}
                </View>
              ))}
          </View>

          {/* P1 Features */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subsectionTitle}>
              P1: Should Have ({userFeatures.filter((f) => f.mvpPriority === 'P1').length})
            </Text>
            {userFeatures
              .filter((f) => f.mvpPriority === 'P1')
              .map((feature) => (
                <View key={feature.id} style={styles.listItem}>
                  <Text style={styles.text}>• {feature.featureName}</Text>
                </View>
              ))}
          </View>

          {/* P2 Features */}
          <View style={{ marginBottom: 15 }}>
            <Text style={styles.subsectionTitle}>
              P2: Nice to Have ({userFeatures.filter((f) => f.mvpPriority === 'P2').length})
            </Text>
            {userFeatures
              .filter((f) => f.mvpPriority === 'P2')
              .map((feature) => (
                <View key={feature.id} style={styles.listItem}>
                  <Text style={styles.text}>• {feature.featureName}</Text>
                </View>
              ))}
          </View>
        </View>
      </Page>

      {/* Page 4: Deficits & Standouts */}
      <Page size="A4" style={styles.page}>
        {/* Competitive Deficits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Competitive Deficits</Text>
          {deficits.map((deficit) => (
            <View key={deficit.id} style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>
                {deficit.title} ({deficit.severity || 'medium'})
              </Text>
              <Text style={styles.text}>{deficit.description}</Text>
              <Text style={{ fontSize: 10, color: '#666', marginTop: 3 }}>
                Recommendation: {deficit.recommendation}
              </Text>
            </View>
          ))}
        </View>

        {/* Unique Standouts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Unique Standouts</Text>
          {standouts.map((standout) => (
            <View key={standout.id} style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>
                {standout.title} (Score: {standout.opportunityScore || 0}/100)
              </Text>
              <Text style={styles.text}>{standout.description}</Text>
              <Text style={{ fontSize: 10, color: '#666', marginTop: 3 }}>
                Recommendation: {standout.recommendation}
              </Text>
            </View>
          ))}
        </View>
      </Page>

      {/* Page 5: Blue Ocean & Personas */}
      <Page size="A4" style={styles.page}>
        {/* Blue Ocean */}
        {blueOceanInsight && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Blue Ocean Opportunity</Text>
            <Text style={styles.subsectionTitle}>
              {blueOceanInsight.marketVacuumTitle}
            </Text>
            <Text style={styles.text}>{blueOceanInsight.description}</Text>
            <Text style={{ fontSize: 10, marginTop: 5 }}>
              Target Segment: {blueOceanInsight.targetSegment}
            </Text>
            <Text style={{ fontSize: 10 }}>
              Opportunity: {blueOceanInsight.estimatedOpportunity}
            </Text>
            <Text style={{ fontSize: 10 }}>
              Difficulty: {blueOceanInsight.implementationDifficulty}
            </Text>
            <Text style={{ fontSize: 10, marginTop: 5, fontWeight: 'bold' }}>
              Recommendation:
            </Text>
            <Text style={{ fontSize: 10 }}>
              {blueOceanInsight.strategicRecommendation}
            </Text>
          </View>
        )}

        {/* Personas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>User Personas</Text>
          {personas.slice(0, 2).map((persona) => (
            <View key={persona.id} style={{ marginBottom: 10 }}>
              <Text style={styles.subsectionTitle}>
                {persona.name} - {persona.title}
              </Text>
              <Text style={styles.text}>{persona.description}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={{ marginTop: 30, paddingTop: 10, borderTop: '1pt solid #ccc' }}>
          <Text style={{ fontSize: 9, color: '#666', textAlign: 'center' }}>
            Report generated by CompeteIQ - Competitive Intelligence Platform
          </Text>
          <Text style={{ fontSize: 9, color: '#666', textAlign: 'center' }}>
            Analysis ID: {analysis.id}
          </Text>
        </View>
      </Page>
    </Document>
  );
};
