// Editor Suggestions Service
// Provides intelligent auto-completions and suggestions for writing

interface Suggestion {
  text: string;
  type: 'word' | 'phrase' | 'sentence' | 'transition';
  confidence: number;
}

class EditorSuggestionsService {
  private commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
    'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me'
  ]);

  private transitions = [
    'however', 'therefore', 'furthermore', 'moreover', 'consequently',
    'in addition', 'meanwhile', 'nevertheless', 'nonetheless', 'on the other hand',
    'in contrast', 'similarly', 'likewise', 'for instance', 'for example',
    'in particular', 'specifically', 'to illustrate', 'in conclusion', 'finally',
    'ultimately', 'in summary', 'to summarize', 'as a result', 'thus', 'hence'
  ];

  private descriptiveWords = [
    'vibrant', 'serene', 'melancholy', 'exuberant', 'ethereal', 'mundane',
    'extraordinary', 'profound', 'subtle', 'pronounced', 'intricate', 'delicate',
    'robust', 'fragile', 'timeless', 'ephemeral', 'luminous', 'shadowy',
    'resonant', 'muted', 'cacophonous', 'harmonious', 'discordant', 'symmetrical'
  ];

  private actionVerbs = [
    'embark', 'traverse', 'navigate', 'explore', 'discover', 'uncover',
    'reveal', 'conceal', 'transform', 'transmute', 'metamorphose', 'evolve',
    'devolve', 'ascend', 'descend', 'soar', 'plummet', 'meander', 'wander'
  ];

  getSuggestions(context: string, cursorPosition: number): Suggestion[] {
    const textBeforeCursor = context.substring(0, cursorPosition);
    const currentWord = this.getCurrentWord(textBeforeCursor);
    
    const suggestions: Suggestion[] = [];

    // Word completions
    if (currentWord.length >= 2) {
      const wordCompletions = this.getWordCompletions(currentWord);
      suggestions.push(...wordCompletions);
    }

    // Phrase suggestions based on context
    const phraseSuggestions = this.getPhraseSuggestions(textBeforeCursor);
    suggestions.push(...phraseSuggestions);

    // Transition suggestions
    const transitionSuggestions = this.getTransitionSuggestions(textBeforeCursor);
    suggestions.push(...transitionSuggestions);

    // Sort by confidence and limit to top 10
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
  }

  private getCurrentWord(text: string): string {
    const words = text.split(/\s+/);
    return words[words.length - 1] || '';
  }

  private getWordCompletions(partial: string): Suggestion[] {
    const completions: Suggestion[] = [];
    const lowerPartial = partial.toLowerCase();

    // Check descriptive words
    this.descriptiveWords.forEach(word => {
      if (word.startsWith(lowerPartial)) {
        completions.push({
          text: word,
          type: 'word',
          confidence: 0.9
        });
      }
    });

    // Check action verbs
    this.actionVerbs.forEach(word => {
      if (word.startsWith(lowerPartial)) {
        completions.push({
          text: word,
          type: 'word',
          confidence: 0.85
        });
      }
    });

    // Check transitions
    this.transitions.forEach(word => {
      if (word.startsWith(lowerPartial)) {
        completions.push({
          text: word,
          type: 'transition',
          confidence: 0.8
        });
      }
    });

    return completions;
  }

  private getPhraseSuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerText = text.toLowerCase();

    // Common phrase patterns
    const phrasePatterns = [
      { trigger: 'in order to', suggestion: 'in order to', confidence: 0.85 },
      { trigger: 'as well as', suggestion: 'as well as', confidence: 0.85 },
      { trigger: 'at the same time', suggestion: 'at the same time', confidence: 0.8 },
      { trigger: 'on the other hand', suggestion: 'on the other hand', confidence: 0.8 },
      { trigger: 'in the end', suggestion: 'in the end', confidence: 0.75 },
      { trigger: 'in the beginning', suggestion: 'in the beginning', confidence: 0.75 },
      { trigger: 'first of all', suggestion: 'first of all', confidence: 0.75 },
      { trigger: 'last but not least', suggestion: 'last but not least', confidence: 0.7 },
    ];

    phrasePatterns.forEach(pattern => {
      if (lowerText.endsWith(pattern.trigger.substring(0, -3)) || 
          lowerText.includes(pattern.trigger)) {
        suggestions.push({
          text: pattern.suggestion,
          type: 'phrase',
          confidence: pattern.confidence
        });
      }
    });

    return suggestions;
  }

  private getTransitionSuggestions(text: string): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const lowerText = text.toLowerCase().trim();

    // Suggest transitions after sentences
    if (lowerText.endsWith('.') || lowerText.endsWith('!') || lowerText.endsWith('?')) {
      this.transitions.forEach(transition => {
        suggestions.push({
          text: transition,
          type: 'transition',
          confidence: 0.7
        });
      });
    }

    return suggestions;
  }

  // Get contextual sentence completions
  getSentenceCompletions(text: string): Suggestion[] {
    const completions: Suggestion[] = [];
    const sentences = text.split(/[.!?]+/);
    const lastSentence = sentences[sentences.length - 1]?.trim() || '';

    // If the last sentence is incomplete, suggest completions
    if (lastSentence.length > 0 && !lastSentence.endsWith('.')) {
      const sentenceStarters = [
        'This suggests that', 'It appears that', 'The evidence indicates',
        'One might argue that', 'It becomes clear that', 'This leads us to',
        'As a result', 'Consequently', 'Therefore', 'Thus'
      ];

      sentenceStarters.forEach(starter => {
        completions.push({
          text: starter,
          type: 'sentence',
          confidence: 0.65
        });
      });
    }

    return completions;
  }
}

export const editorSuggestionsService = new EditorSuggestionsService();
