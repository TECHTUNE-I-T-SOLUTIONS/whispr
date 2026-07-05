// Gemini Adapter
// AI provider adapter following docs/V2/ section 9

import { BaseAdapter } from './base-adapter';
import { GoogleGenAI } from '@google/genai';

export class GeminiAdapter extends BaseAdapter {
  name = 'gemini';
  private client: GoogleGenAI | null = null;
  private model = 'gemini-1.5-flash';

  constructor() {
    super();
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.client = new GoogleGenAI({ apiKey });
    }
  }

  async search(query: string, options?: any): Promise<any> {
    if (!this.client) {
      throw new Error('Gemini client not initialized');
    }

    return this.withRetry(async () => {
      const result = await this.client!.models.generateContent({
        model: this.model,
        contents: query,
        config: {
          temperature: options?.temperature ?? 0.7,
          maxOutputTokens: options?.maxTokens ?? 4096,
        },
      });

      return {
        text: result.text || '',
        usage: result.usageMetadata,
      };
    }, 'search');
  }

  async fetch(id: string, options?: any): Promise<any> {
    // Gemini doesn't have a fetch by ID concept
    // This is a placeholder for future use
    return { error: 'Not implemented for Gemini' };
  }

  async latest(options?: any): Promise<any> {
    // Gemini doesn't have a latest concept
    return { error: 'Not implemented for Gemini' };
  }

  async trending(options?: any): Promise<any> {
    // Gemini doesn't have a trending concept
    return { error: 'Not implemented for Gemini' };
  }

  async details(url: string, options?: any): Promise<any> {
    // Gemini doesn't have a details by URL concept
    return { error: 'Not implemented for Gemini' };
  }

  setModel(model: string): void {
    this.model = model;
  }

  getModel(): string {
    return this.model;
  }
}

export const geminiAdapter = new GeminiAdapter();
