import { callGemini } from './geminiProvider.js';

function cleanAndParseJSON(rawResponse) {
  if (typeof rawResponse !== 'string') return rawResponse;
  let cleaned = rawResponse.trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return JSON.parse(cleaned);
}

class AITrafficController {
  constructor() {
    this.providers = [
      { name: 'Google Gemini AI', fn: callGemini, isHealthy: true, rateLimitedUntil: 0 },
    ];
    this.currentIndex = 0;
  }

  async generateSocraticQuiz(promptText) {
    const provider = this.providers[0];

    try {
      console.log(`[AI Traffic Controller]: Routing request exclusively to '${provider.name}'...`);
      const rawResult = await provider.fn(promptText);
      const resText = typeof rawResult === 'string' ? rawResult : rawResult.text;
      const modelUsed = rawResult.modelName || 'gemini-flash-latest';

      const parsed = cleanAndParseJSON(resText);
      const questions = parsed.questions || parsed.data?.questions || parsed.answer?.questions;

      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        throw new Error(`Gemini Model '${modelUsed}' returned invalid/empty questions array.`);
      }

      console.log(`✨ [AI Traffic Controller]: Successfully parsed 5 questions from Model '${modelUsed}'.`);

      return {
        providerUsed: provider.name,
        modelUsed,
        data: { questions },
      };
    } catch (err) {
      console.error(`❌ [AI Traffic Controller]: Gemini Quiz Generation failed. Error: ${err.message}`);
      throw new Error(`Gemini AI Model Generation Error: ${err.message}`);
    }
  }
}

export const aiTrafficController = new AITrafficController();

