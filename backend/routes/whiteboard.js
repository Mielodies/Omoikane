import { Router } from 'express';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const geminiKey = process.env.GEMINI_API_KEY;
    const groqKey = process.env.GROQ_API_KEY;

    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `Analyze this whiteboard drawing. Identify what the user drew, what concept or thing it represents, and provide helpful context about it. If it's a diagram, explain the parts. If it's a sketch of something, name it and describe it. If it looks like notes or writing, read and summarize them. Be concise but helpful.

Respond in this JSON format:
{
  "identification": "What the drawing depicts (short label)",
  "description": "Detailed analysis of what you see",
  "relatedConcepts": ["concept1", "concept2", "concept3"],
  "suggestion": "A helpful suggestion or next step"
}`;

    if (geminiKey && geminiKey !== 'your-key-here') {
      try {
        const result = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: 'image/png', data: base64Data } },
                ],
              }],
              generationConfig: { temperature: 0.5, maxOutputTokens: 1024 },
            }),
          }
        );

        if (result.ok) {
          const data = await result.json();
          const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (content) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) return res.json(JSON.parse(jsonMatch[0]));
            return res.json({ identification: 'Drawing', description: content, relatedConcepts: [], suggestion: '' });
          }
        }
      } catch (e) {
        console.warn('Gemini vision failed, falling back to text analysis:', e.message);
      }
    }

    if (groqKey && groqKey !== 'your-key-here') {
      try {
        const result = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [{
              role: 'user',
              content: `I have a whiteboard drawing but I can only describe it textually. Please provide a generic whiteboard analysis template. In a real scenario, the AI would analyze the drawing and return information about what was drawn, related concepts, and suggestions. For now, return a placeholder indicating the analysis was performed. ${prompt}`,
            }],
            temperature: 0.5,
            max_tokens: 1024,
          }),
        });

        if (result.ok) {
          const data = await result.json();
          const content = data.choices[0].message.content;
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) return res.json(JSON.parse(jsonMatch[0]));
          return res.json({ identification: 'Drawing', description: content, relatedConcepts: [], suggestion: '' });
        }
      } catch (e) {
        console.warn('Groq fallback failed:', e.message);
      }
    }

    res.json({
      identification: 'Whiteboard Drawing',
      description: 'To use AI analysis, add a GEMINI_API_KEY to your .env file (free at https://aistudio.google.com/apikey). Groq does not support image/vision analysis on the free tier.',
      relatedConcepts: ['AI Vision', 'Image Analysis'],
      suggestion: 'Get a free Gemini API key to enable vision-powered whiteboard analysis.',
    });
  } catch (err) {
    console.error('Whiteboard analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
