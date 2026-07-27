import { Router } from 'express';
import multer from 'multer';
import { run, get, getAll, insert } from '../db.js';
import { optionalAuth } from '../middleware/auth.js';
import { generateCards } from '../services/ai.js';
import { extractPdfText } from '../services/pdf.js';
import { extractYouTubeTranscript } from '../services/youtube.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

router.post('/process', optionalAuth, upload.single('file'), async (req, res) => {
  try {
    const { sourceType, text, youtubeUrl, title } = req.body;
    let extractedText = '';
    let preview = '';

    if (sourceType === 'text') {
      extractedText = text || '';
      preview = extractedText.slice(0, 200);
    } else if (sourceType === 'pdf') {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      extractedText = await extractPdfText(req.file.buffer);
      preview = req.file.originalname;
    } else if (sourceType === 'youtube') {
      extractedText = await extractYouTubeTranscript(youtubeUrl);
      preview = youtubeUrl;
    } else {
      return res.status(400).json({ error: 'Invalid source type' });
    }

    if (!extractedText.trim()) {
      return res.status(400).json({ error: 'No text content found' });
    }

    const deckTitle = title || (sourceType === 'pdf' ? preview : `Study material ${new Date().toLocaleDateString()}`);

    const aiResult = await generateCards(extractedText, deckTitle);

    const totalCards = (aiResult.flashcards?.length || 0) + (aiResult.quizzes?.length || 0);
    const deckId = insert(
      'INSERT INTO decks (user_id, title, source_type, source_preview, card_count) VALUES (?, ?, ?, ?, ?)',
      [req.userId || null, deckTitle, sourceType, preview, totalCards]
    );

    for (const fc of aiResult.flashcards || []) {
      run(
        'INSERT INTO cards (deck_id, type, question, answer, options) VALUES (?, ?, ?, ?, ?)',
        [deckId, 'flashcard', fc.question, fc.answer, null]
      );
    }
    for (const q of aiResult.quizzes || []) {
      run(
        'INSERT INTO cards (deck_id, type, question, answer, options) VALUES (?, ?, ?, ?, ?)',
        [deckId, 'quiz', q.question, q.options[q.correctIndex], JSON.stringify(q.options)]
      );
    }

    const deck = get('SELECT * FROM decks WHERE id = ?', [deckId]);
    const cards = getAll('SELECT * FROM cards WHERE deck_id = ?', [deckId]);

    res.json({ deck, cards });
  } catch (err) {
    console.error('Document processing error:', err);
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

export default router;
