import { Router } from 'express';
import crypto from 'crypto';
import { get, insert, getAll } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/:deckId', authMiddleware, (req, res) => {
  const deck = get('SELECT * FROM decks WHERE id = ? AND user_id = ?', [req.params.deckId, req.userId]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  let shared = get('SELECT * FROM shared_decks WHERE deck_id = ?', [req.params.deckId]);
  if (!shared) {
    const token = crypto.randomBytes(16).toString('hex');
    const id = insert('INSERT INTO shared_decks (deck_id, share_token) VALUES (?, ?)', [req.params.deckId, token]);
    shared = { id, deck_id: req.params.deckId, share_token: token };
  }
  res.json({ token: shared.share_token });
});

router.get('/:token', (req, res) => {
  const shared = get('SELECT * FROM shared_decks WHERE share_token = ?', [req.params.token]);
  if (!shared) return res.status(404).json({ error: 'Shared deck not found' });

  const deck = get('SELECT id, title, source_type, card_count, created_at FROM decks WHERE id = ?', [shared.deck_id]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const cards = getAll('SELECT id, type, question, answer, options FROM cards WHERE deck_id = ?', [shared.deck_id]);
  res.json({ deck, cards });
});

export default router;
