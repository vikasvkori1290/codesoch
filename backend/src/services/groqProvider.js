import Groq from 'groq-sdk';

export async function callGroq(promptText) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is missing');

  const groq = new Groq({ apiKey });
  const chatCompletion = await groq.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a Socratic technical interview AI generator. Respond exclusively in valid JSON.' },
      { role: 'user', content: promptText },
    ],
    model: 'llama3-8b-8192',
    response_format: { type: 'json_object' },
  });

  return chatCompletion.choices[0]?.message?.content || '';
}
