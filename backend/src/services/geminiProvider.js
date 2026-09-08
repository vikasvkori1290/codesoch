import { GoogleGenerativeAI } from '@google/generative-ai';

export async function callGemini(promptText) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing from environment variables (process.env.GEMINI_API_KEY)');

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.6-flash',
    'gemini-flash-latest',
  ];

  console.log('\n==================================================');
  console.log('🤖 [GEMINI AI PROVIDER]: INITIATING REQUEST');
  console.log('--------------------------------------------------');
  console.log('📄 PROMPT SENT TO GEMINI MODEL:');
  console.log(promptText.trim());
  console.log('==================================================\n');

  let lastErr = null;
  for (const modelName of modelsToTry) {
    try {
      console.log(`[Gemini AI Provider]: Requesting model '${modelName}'...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: { responseMimeType: 'application/json' },
      });
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const resText = response.text();
      
      if (resText) {
        console.log(`✅ [Gemini AI Provider SUCCESS]: Response received from Model '${modelName}'!`);
        console.log(`📥 RAW GEMINI RESPONSE (Length: ${resText.length} chars):\n`, resText.slice(0, 300) + '...');
        return { text: resText, modelName };
      }
    } catch (err) {
      console.warn(`⚠️ [Gemini AI Provider WARN]: Model '${modelName}' failed. Reason: ${err.message}`);
      lastErr = err;
    }
  }

  console.error('❌ [Gemini AI Provider ERROR]: All attempted Gemini models failed!');
  throw lastErr || new Error('Gemini API call failed across all configured models.');
}

