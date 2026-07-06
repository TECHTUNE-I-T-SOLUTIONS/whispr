// Content Authenticity Checker Service
// Uses ai-text-detector to analyze content for AI-generated patterns
// Policy: AI can assist but content must be refined and original

import { detectAIText, getConfidenceScore, isAIGenerated } from 'ai-text-detector';

interface SectionAnalysis {
  lineNumber: number;
  text: string;
  isAIGenerated: boolean;
  confidenceScore: number;
  authenticityScore: number;
}

interface AuthenticityResult {
  isAIGenerated: boolean;
  confidenceScore: number; // 0-1, higher means more likely AI
  authenticityScore: number; // 0-100, higher means more human
  reasoning: string[];
  metrics: {
    perplexity: number;
    burstiness: number;
    vocabulary: number;
    structure: number;
  };
  canProceed: boolean; // Whether content meets authenticity threshold
  recommendation: string;
  sectionAnalysis: SectionAnalysis[]; // Line-by-line analysis
  aiSections: SectionAnalysis[]; // Only sections flagged as AI
}

class ContentAuthenticityService {
  private readonly AUTHENTICITY_THRESHOLD = 80; // Minimum 80% authenticity score to proceed
  private readonly WARNING_THRESHOLD = 80; // Below 80% blocks publishing
  private readonly MIN_TEXT_LENGTH = 50; // Minimum characters for analysis
  private readonly SECTION_THRESHOLD = 0.6; // 60% AI confidence to flag a section

  async checkContent(content: string): Promise<AuthenticityResult> {
    // Check minimum length
    if (content.length < this.MIN_TEXT_LENGTH) {
      return {
        isAIGenerated: false,
        confidenceScore: 0,
        authenticityScore: 100,
        reasoning: ['Content too short for analysis'],
        metrics: {
          perplexity: 0,
          burstiness: 0,
          vocabulary: 0,
          structure: 0,
        },
        canProceed: true,
        recommendation: 'Content is too short for AI detection analysis. Proceed with caution.',
        sectionAnalysis: [],
        aiSections: [],
      };
    }

    try {
      // Analyze full content
      const detection = detectAIText(content);
      const confidence = getConfidenceScore(content);
      const isAI = isAIGenerated(content);

      // Calculate authenticity score (inverse of AI confidence)
      const authenticityScore = Math.round((1 - confidence) * 100);

      // Determine if content can proceed
      const canProceed = authenticityScore >= this.AUTHENTICITY_THRESHOLD;

      // Generate recommendation
      let recommendation = '';
      if (authenticityScore >= 80) {
        recommendation = 'Content appears to be original and human-written. Great job!';
      } else {
        recommendation = 'Content does not meet our authenticity threshold (80%+ required). Please rewrite with your own voice, examples, and personal insights before publishing.';
      }

      // Perform line-by-line analysis
      const sectionAnalysis = await this.analyzeBySections(content);
      const aiSections = sectionAnalysis.filter(s => s.isAIGenerated);

      return {
        isAIGenerated: isAI,
        confidenceScore: confidence,
        authenticityScore,
        reasoning: detection.reasoning || [],
        metrics: {
          perplexity: detection.metrics?.perplexity || 0,
          burstiness: detection.metrics?.burstiness || 0,
          vocabulary: detection.metrics?.vocabulary || 0,
          structure: detection.metrics?.structure || 0,
        },
        canProceed,
        recommendation,
        sectionAnalysis,
        aiSections,
      };
    } catch (error) {
      console.error('Content authenticity check failed:', error);
      // On error, allow proceeding but warn
      return {
        isAIGenerated: false,
        confidenceScore: 0,
        authenticityScore: 50,
        reasoning: ['Analysis failed - proceed with caution'],
        metrics: {
          perplexity: 0,
          burstiness: 0,
          vocabulary: 0,
          structure: 0,
        },
        canProceed: true,
        recommendation: 'Unable to analyze content authenticity. Please ensure content is original and human-written.',
        sectionAnalysis: [],
        aiSections: [],
      };
    }
  }

  private async analyzeBySections(content: string): Promise<SectionAnalysis[]> {
    // Split content into paragraphs/sections
    const sections = content.split(/\n\n+/).filter(s => s.trim().length > 0);
    const analysis: SectionAnalysis[] = [];

    for (let i = 0; i < sections.length; i++) {
      const section = sections[i].trim();
      if (section.length < 20) continue; // Skip very short sections

      try {
        const sectionConfidence = getConfidenceScore(section);
        const sectionIsAI = isAIGenerated(section);
        const sectionAuthenticity = Math.round((1 - sectionConfidence) * 100);

        analysis.push({
          lineNumber: i + 1,
          text: section,
          isAIGenerated: sectionIsAI || sectionConfidence > this.SECTION_THRESHOLD,
          confidenceScore: sectionConfidence,
          authenticityScore: sectionAuthenticity,
        });
      } catch (error) {
        // If analysis fails for a section, mark as neutral
        analysis.push({
          lineNumber: i + 1,
          text: section,
          isAIGenerated: false,
          confidenceScore: 0.5,
          authenticityScore: 50,
        });
      }
    }

    return analysis;
  }

  // Check multiple sections (e.g., for longer content)
  async checkContentSections(sections: string[]): Promise<AuthenticityResult> {
    if (sections.length === 0) {
      return this.checkContent('');
    }

    if (sections.length === 1) {
      return this.checkContent(sections[0]);
    }

    // Analyze each section and average the results
    const results = await Promise.all(sections.map(s => this.checkContent(s)));

    const avgConfidence = results.reduce((sum, r) => sum + r.confidenceScore, 0) / results.length;
    const avgAuthenticity = results.reduce((sum, r) => sum + r.authenticityScore, 0) / results.length;
    const anyAI = results.some(r => r.isAIGenerated);

    // Combine reasoning
    const allReasoning = results.flatMap(r => r.reasoning);
    const uniqueReasoning = [...new Set(allReasoning)];

    // Combine section analyses
    const allSectionAnalysis: SectionAnalysis[] = [];
    let lineOffset = 1;
    results.forEach(result => {
      result.sectionAnalysis.forEach(section => {
        allSectionAnalysis.push({
          ...section,
          lineNumber: lineOffset + section.lineNumber - 1,
        });
      });
      lineOffset += result.sectionAnalysis.length;
    });

    const allAISections = allSectionAnalysis.filter(s => s.isAIGenerated);

    return {
      isAIGenerated: anyAI,
      confidenceScore: avgConfidence,
      authenticityScore: Math.round(avgAuthenticity),
      reasoning: uniqueReasoning,
      metrics: {
        perplexity: results.reduce((sum, r) => sum + r.metrics.perplexity, 0) / results.length,
        burstiness: results.reduce((sum, r) => sum + r.metrics.burstiness, 0) / results.length,
        vocabulary: results.reduce((sum, r) => sum + r.metrics.vocabulary, 0) / results.length,
        structure: results.reduce((sum, r) => sum + r.metrics.structure, 0) / results.length,
      },
      canProceed: avgAuthenticity >= this.AUTHENTICITY_THRESHOLD,
      recommendation: avgAuthenticity >= 80
        ? 'Content sections appear to be original and human-written.'
        : 'Content does not meet our authenticity threshold (80%+ required). Please rewrite sections with your own voice.',
      sectionAnalysis: allSectionAnalysis,
      aiSections: allAISections,
    };
  }

  // Get policy explanation for UI
  getPolicyExplanation(): string {
    return `Our AI Content Policy: We encourage the use of AI as a writing assistant, but all published content must be original and substantially refined by human creators. AI can help with grammar, structure, and suggestions, but the final work must reflect your unique voice, experiences, and perspective. Content that appears to be primarily AI-generated will be flagged for revision.`;
  }
}

export const contentAuthenticityService = new ContentAuthenticityService();
