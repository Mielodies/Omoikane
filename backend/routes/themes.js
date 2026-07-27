import { Router } from 'express';
import { get, insert, run } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/:deckId', (req, res) => {
  const theme = get('SELECT * FROM deck_themes WHERE deck_id = ?', [req.params.deckId]);
  res.json(theme || { bg_color: '#1f2937', card_bg: '#111827', accent_color: '#a855f7', text_color: '#f3f4f6' });
});

router.put('/:deckId', authMiddleware, (req, res) => {
  const { bg_color, card_bg, accent_color, text_color } = req.body;
  const existing = get('SELECT * FROM deck_themes WHERE deck_id = ?', [req.params.deckId]);
  if (existing) {
    run('UPDATE deck_themes SET bg_color = ?, card_bg = ?, accent_color = ?, text_color = ? WHERE deck_id = ?',
      [bg_color || existing.bg_color, card_bg || existing.card_bg, accent_color || existing.accent_color, text_color || existing.text_color, req.params.deckId]);
  } else {
    insert('INSERT INTO deck_themes (deck_id, bg_color, card_bg, accent_color, text_color) VALUES (?, ?, ?, ?, ?)',
      [req.params.deckId, bg_color || '#1f2937', card_bg || '#111827', accent_color || '#a855f7', text_color || '#f3f4f6']);
  }
  res.json({ success: true });
});

export default router;