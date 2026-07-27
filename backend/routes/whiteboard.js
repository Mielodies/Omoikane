import { Router } from 'express';

const router = Router();

router.post('/analyze', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) return res.status(400).json({ error: 'No image provided' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not configured' });

    const base64Data = image.includes(',') ? image.split(',')[1] : image;

    const prompt = `Analyze this whiteboard drawing. Identify what the user drew, what concept or thing it represents, and provide helpful context about it. If it's a diagram, explain the parts. If it's a sketch of something, name it and describe it. If it looks like notes or writing, read and summarize them. Be concise but helpful. If you can identify what they might be studying or working on, mention related concepts they might want to know about.

Respond in this JSON format:
{
  "identification": "What the drawing depicts (short label)",
  "description": "Detailed analysis of what you see",
  "relatedConcepts": ["concept1", "concept2", "concept3"],
  "suggestion": "A helpful suggestion or next step"
}`;

    const res2 = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.2-90b-vision-preview',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64Data}` } },
            ],
          },
        ],
        temperature: 0.5,
        max_tokens: 1024,
      }),
    });

    if (!res2.ok) {
      const err = await res2.json().catch(() => ({}));
      throw new Error(err.error?.message || 'AI analysis failed');
    }

    const data = await res2.json();
    const content = data.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      res.json(JSON.parse(jsonMatch[0]));
    } else {
      res.json({
        identification: 'Drawing',
        description: content,
        relatedConcepts: [],
        suggestion: '',
      });
    }
  } catch (err) {
    console.error('Whiteboard analysis error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
