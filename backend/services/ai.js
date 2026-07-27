export async function generateCards(text, title) {
  const apiKey = process.env.GROQ_API_KEY;

  const prompt = `You are an expert study tool generator. Given the following study material titled "${title}", generate a comprehensive set of flashcards and multiple-choice quiz questions.

Generate 10-20 flashcards (question/answer pairs) and 5-10 multiple-choice quiz questions (each with 4 options and a correct answer index).

IMPORTANT: Return ONLY valid JSON, no markdown fences, no explanation.

{
  "flashcards": [
    {"question": "...", "answer": "..."}
  ],
  "quizzes": [
    {"question": "...", "options": ["A", "B", "C", "D"], "correctIndex": 0}
  ]
}

Study material:
${text.slice(0, 80000)}`;

  let res;
  const models = ['llama-3.3-70b-versatile', 'llama3-70b-8192', 'mixtral-8x7b-32768'];

  for (const model of models) {
    try {
      res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 8192,
        }),
      });

      if (res.ok) break;

      const errBody = await res.json().catch(() => ({}));
      console.warn(`Model ${model} failed:`, errBody.error?.message || res.status);
    } catch (e) {
      console.warn(`Model ${model} fetch error:`, e.message);
    }
  }

  if (!res || !res.ok) {
    const errBody = await res?.json().catch(() => ({}));
    throw new Error(errBody?.error?.message || 'AI generation failed — check your Groq API key');
  }

  const data = await res.json();
  const content = data.choices[0].message.content;

  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Failed to parse AI response');

  return JSON.parse(jsonMatch[0]);
}
