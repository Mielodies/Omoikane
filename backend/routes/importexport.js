import { Router } from 'express';
import { get, getAll, insert, run } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/export/:deckId', authMiddleware, (req, res) => {
  const deck = get('SELECT * FROM decks WHERE id = ? AND user_id = ?', [req.params.deckId, req.userId]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const cards = getAll('SELECT type, question, answer, options FROM cards WHERE deck_id = ?', [req.params.deckId]);
  res.json({ title: deck.title, cards });
});

router.post('/import', authMiddleware, (req, res) => {
  const { title, cards } = req.body;
  if (!title || !cards || !cards.length) return res.status(400).json({ error: 'title and cards required' });

  const deckId = insert('INSERT INTO decks (user_id, title, source_type, card_count) VALUES (?, ?, ?, ?)',
    [req.userId, title, 'text', cards.length]);

  for (const card of cards) {
    insert('INSERT INTO cards (deck_id, type, question, answer, options) VALUES (?, ?, ?, ?, ?)',
      [deckId, card.type || 'flashcard', card.question, card.answer, card.options ? JSON.stringify(card.options) : null]);
  }

  res.json({ deckId, title, cardCount: cards.length });
});

export default router;
