import Groq from 'groq-sdk';

export async function callGroq(promptText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing');

  const groq = new Groq({ apiKey });
  const modelsToTry = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'llama3-8b-8192', 'gemma2-9b-it'];

  let lastErr = null;
  for (const modelName of modelsToTry) {
    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an expert Socratic technical interviewer. Respond exclusively in valid JSON.' },
          { role: 'user', content: promptText },
        ],
        model: modelName,
        response_format: { type: 'json_object' },
      });
      const resText = chatCompletion.choices[0]?.message?.content || '';
      if (resText) return resText;
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error('Groq API call failed');
}
