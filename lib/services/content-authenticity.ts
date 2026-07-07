// Content Authenticity Checker Service
// Uses ai-text-detector to analyze content for AI-generated patterns
// Enhanced with additional pattern detection for better AI identification
// Policy: AI can assist but content must be refined and original

import { detectAIText, getConfidenceScore, isAIGenerated } from 'ai-text-detector';

// Common AI-generated phrases and patterns
const AI_PATTERNS = [
  // Generic AI transitions
  /\b(in conclusion|furthermore|moreover|additionally|consequently|therefore|thus|hence|nonetheless|nevertheless)\b/gi,
  // AI clichés
  /\b(it's important to note|it's worth mentioning|it's crucial to understand|plays a pivotal role|serves as a testament)\b/gi,
  // AI structural patterns
  /\b(in today's world|in the realm of|in the landscape of|in the context of|in the era of)\b/gi,
  // AI hedging
  /\b(arguably|arguably the|it could be argued that|one might argue that|it's safe to say)\b/gi,
  // AI conclusion patterns
  /\b(to sum up|in summary|to summarize|in conclusion|ultimately|in essence)\b/gi,
];

// AI-specific vocabulary patterns
const AI_VOCABULARY = [
  'delve', 'underscore', 'highlight', 'emphasize', 'comprehensive',
  'multifaceted', 'nuanced', 'intricate', 'sophisticated', 'paradigm',
  'synergy', 'leverage', 'optimize', 'streamline', 'revolutionize',
  'transformative', 'cutting-edge', 'state-of-the-art', 'groundbreaking',
  'holistic', 'integrated', 'seamless', 'robust', 'scalable',
];

// Repetitive sentence structures (common in AI)
function detectRepetitiveStructure(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 3) return 0;

  const sentenceStarts = sentences.map(s => s.trim().split(' ')[0].toLowerCase());
  const uniqueStarts = new Set(sentenceStarts);
  const repetitionRatio = 1 - (uniqueStarts.size / sentenceStarts.length);
  
  return repetitionRatio > 0.3 ? repetitionRatio * 100 : 0;
}

// Uniform sentence length (AI tends to have consistent sentence lengths)
function detectUniformSentenceLength(text: string): number {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  if (sentences.length < 5) return 0;

  const lengths = sentences.map(s => s.trim().length);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);
  
  // Low standard deviation indicates uniform lengths
  const coefficientOfVariation = stdDev / avgLength;
  return coefficientOfVariation < 0.3 ? (1 - coefficientOfVariation) * 50 : 0;
}

// Excessive use of passive voice (common in AI)
function detectPassiveVoice(text: string): number {
  const passivePatterns = [
    /\b(is|are|was|were|be|been|being)\s+\w+ed\b/gi,
    /\b(is|are|was|were)\s+\w+ed\s+by\b/gi,
  ];
  
  let passiveCount = 0;
  passivePatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) passiveCount += matches.length;
  });
  
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const passiveRatio = passiveCount / sentences.length;
  
  return passiveRatio > 0.3 ? passiveRatio * 40 : 0;
}

// Lack of personal voice and anecdotes
function detectPersonalVoice(text: string): number {
  const personalIndicators = [
    /\b(i|my|me|mine|myself)\b/gi,
    /\b(personal experience|in my opinion|i believe|i think|i feel)\b/gi,
    /\b(remember when|i recall|from my experience)\b/gi,
  ];
  
  let personalCount = 0;
  personalIndicators.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) personalCount += matches.length;
  });
  
  const wordCount = text.split(/\s+/).length;
  const personalRatio = personalCount / wordCount;
  
  // Low personal voice indicates potential AI
  return personalRatio < 0.005 ? 30 : 0;
}

// Generic/abstract language vs concrete details
function detectAbstractLanguage(text: string): number {
  const concreteIndicators = [
    /\b(specific|particular|exact|precise|definite)\b/gi,
    /\b(example|instance|case|illustration)\b/gi,
    /\b(\d+|(one|two|three|four|five|six|seven|eight|nine|ten))\b/gi,
  ];
  
  let concreteCount = 0;
  concreteIndicators.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) concreteCount += matches.length;
  });
  
  const wordCount = text.split(/\s+/).length;
  const concreteRatio = concreteCount / wordCount;
  
  // Low concrete details indicate potential AI
  return concreteRatio < 0.01 ? 25 : 0;
}

// Check for AI vocabulary usage
function detectAIVocabulary(text: string): number {
  const words = text.toLowerCase().split(/\s+/);
  const aiWords = words.filter(word => AI_VOCABULARY.includes(word));
  const aiRatio = aiWords.length / words.length;
  
  return aiRatio > 0.05 ? aiRatio * 100 : 0;
}

// Check for AI pattern usage
function detectAIPatterns(text: string): number {
  let patternCount = 0;
  AI_PATTERNS.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) patternCount += matches.length;
  });
  
  const wordCount = text.split(/\s+/).length;
  const patternRatio = patternCount / wordCount;
  
  return patternRatio > 0.02 ? patternRatio * 80 : 0;
}

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
  private AUTHENTICITY_THRESHOLD = 70; // Default: Minimum 70% authenticity score to proceed
  private WARNING_THRESHOLD = 70; // Default: Below 70% blocks publishing
  private readonly MIN_TEXT_LENGTH = 50; // Minimum characters for analysis
  private SECTION_THRESHOLD = 0.5; // Default: 50% AI confidence to flag a section
  private readonly MAX_PARAGRAPH_LENGTH = 800; // Default: Split paragraphs longer than this

  async checkContent(content: string): Promise<AuthenticityResult> {
    // Load dynamic config from database
    await this.loadConfig();

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
      // Analyze full content with ai-text-detector
      const detection = detectAIText(content);
      const baseConfidence = getConfidenceScore(content);
      const isAI = isAIGenerated(content);

      // Enhanced pattern detection
      const patternScores = {
        repetitiveStructure: detectRepetitiveStructure(content),
        uniformSentenceLength: detectUniformSentenceLength(content),
        passiveVoice: detectPassiveVoice(content),
        personalVoice: detectPersonalVoice(content),
        abstractLanguage: detectAbstractLanguage(content),
        aiVocabulary: detectAIVocabulary(content),
        aiPatterns: detectAIPatterns(content),
      };

      // Calculate weighted confidence score
      // Base ai-text-detector score (60% weight)
      // Pattern detection scores (40% weight distributed)
      const patternWeight = 0.4;
      const baseWeight = 0.6;
      
      const totalPatternScore = Object.values(patternScores).reduce((sum, score) => sum + score, 0) / 7;
      const enhancedConfidence = (baseConfidence * baseWeight) + (totalPatternScore / 100 * patternWeight);
      
      // Clamp confidence between 0 and 1
      const confidence = Math.max(0, Math.min(1, enhancedConfidence));

      // Calculate authenticity score (inverse of AI confidence)
      const authenticityScore = Math.round((1 - confidence) * 100);

      // Determine if content can proceed
      const canProceed = authenticityScore >= this.AUTHENTICITY_THRESHOLD;

      // Generate detailed reasoning
      const reasoning: string[] = [];
      if (patternScores.repetitiveStructure > 0) {
        reasoning.push(`Repetitive sentence structures detected (${patternScores.repetitiveStructure.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.uniformSentenceLength > 0) {
        reasoning.push(`Uniform sentence lengths suggest AI generation (${patternScores.uniformSentenceLength.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.passiveVoice > 0) {
        reasoning.push(`Excessive passive voice detected (${patternScores.passiveVoice.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.personalVoice > 0) {
        reasoning.push(`Lack of personal voice and anecdotes (${patternScores.personalVoice.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.abstractLanguage > 0) {
        reasoning.push(`Generic/abstract language without concrete details (${patternScores.abstractLanguage.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.aiVocabulary > 0) {
        reasoning.push(`AI-specific vocabulary usage (${patternScores.aiVocabulary.toFixed(0)}% AI likelihood)`);
      }
      if (patternScores.aiPatterns > 0) {
        reasoning.push(`Common AI transition phrases and patterns (${patternScores.aiPatterns.toFixed(0)}% AI likelihood)`);
      }

      // Generate recommendation
      let recommendation = '';
      if (authenticityScore >= this.AUTHENTICITY_THRESHOLD) {
        recommendation = 'Content appears to be original and human-written. Great job!';
      } else {
        recommendation = `Content does not meet our authenticity threshold (${this.AUTHENTICITY_THRESHOLD}%+ required). Please rewrite with your own voice, examples, and personal insights before publishing.`;
      }

      // Perform line-by-line analysis
      const sectionAnalysis = await this.analyzeBySections(content);
      const aiSections = sectionAnalysis.filter(s => s.isAIGenerated);

      return {
        isAIGenerated: isAI || confidence > 0.5,
        confidenceScore: confidence,
        authenticityScore,
        reasoning,
        metrics: {
          perplexity: patternScores.uniformSentenceLength,
          burstiness: patternScores.repetitiveStructure,
          vocabulary: patternScores.aiVocabulary,
          structure: patternScores.aiPatterns,
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
    // Load dynamic config from database
    await this.loadConfig();

    // Split content into paragraphs/sections
    const sections = content.split(/\n\n+/).filter(s => s.trim().length > 0);
    
    // Split long paragraphs
    const processedSections: string[] = [];
    for (const section of sections) {
      if (section.length > this.MAX_PARAGRAPH_LENGTH) {
        // Split long paragraphs into smaller chunks
        const words = section.split(' ');
        const chunks: string[] = [];
        let currentChunk: string[] = [];
        let currentLength = 0;
        
        for (const word of words) {
          if (currentLength + word.length > this.MAX_PARAGRAPH_LENGTH && currentChunk.length > 0) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [word];
            currentLength = word.length;
          } else {
            currentChunk.push(word);
            currentLength += word.length + 1;
          }
        }
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.join(' '));
        }
        processedSections.push(...chunks);
      } else {
        processedSections.push(section);
      }
    }
    
    const analysis: SectionAnalysis[] = [];

    for (let i = 0; i < processedSections.length; i++) {
      const section = processedSections[i].trim();
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
    // Load dynamic config from database
    await this.loadConfig();

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
      recommendation: avgAuthenticity >= this.AUTHENTICITY_THRESHOLD
        ? 'Content sections appear to be original and human-written.'
        : `Content does not meet our authenticity threshold (${this.AUTHENTICITY_THRESHOLD}%+ required). Please rewrite sections with your own voice.`,
      sectionAnalysis: allSectionAnalysis,
      aiSections: allAISections,
    };
  }

  // Get policy explanation for UI
  getPolicyExplanation(): string {
    return `Our AI Content Policy: We encourage the use of AI as a writing assistant, but all published content must be original and substantially refined by human creators. AI can help with grammar, structure, and suggestions, but the final work must reflect your unique voice, experiences, and perspective. Content that appears to be primarily AI-generated will be flagged for revision.`;
  }

  // Load configuration from database
  private async loadConfig(): Promise<void> {
    try {
      const { createSupabaseServer } = await import('@/lib/supabase-server');
      const supabase = createSupabaseServer();
      
      const { data, error } = await supabase
        .from('ai_content_config')
        .select('*')
        .single();

      if (error || !data) {
        // Use defaults if no config exists
        this.AUTHENTICITY_THRESHOLD = 70;
        this.SECTION_THRESHOLD = 0.5;
        return;
      }

      // Update thresholds from database
      this.AUTHENTICITY_THRESHOLD = data.authenticity_threshold;
      this.SECTION_THRESHOLD = parseFloat(data.section_threshold);
    } catch (error) {
      console.error('Failed to load AI content config:', error);
      // Keep defaults on error
    }
  }
}

export const contentAuthenticityService = new ContentAuthenticityService();
