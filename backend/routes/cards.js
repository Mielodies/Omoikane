import { Router } from 'express';
import { get, run } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.put('/:id', authMiddleware, (req, res) => {
  const card = get('SELECT c.*, d.user_id FROM cards c JOIN decks d ON c.deck_id = d.id WHERE c.id = ?', [req.params.id]);
  if (!card || card.user_id !== req.userId) return res.status(404).json({ error: 'Card not found' });

  const { question, answer, type, options } = req.body;
  run('UPDATE cards SET question = ?, answer = ?, type = ?, options = ? WHERE id = ?',
    [question || card.question, answer || card.answer, type || card.type, options ? JSON.stringify(options) : card.options, req.params.id]);
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const card = get('SELECT c.*, d.user_id FROM cards c JOIN decks d ON c.deck_id = d.id WHERE c.id = ?', [req.params.id]);
  if (!card || card.user_id !== req.userId) return res.status(404).json({ error: 'Card not found' });

  run('DELETE FROM cards WHERE id = ?', [req.params.id]);
  run('UPDATE decks SET card_count = (SELECT COUNT(*) FROM cards WHERE deck_id = ?) WHERE id = ?', [card.deck_id, card.deck_id]);
  res.json({ success: true });
});

export default router;
