import { Router } from 'express';
import { get, getAll, run, insert } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const tags = getAll('SELECT * FROM tags WHERE user_id = ?', [req.userId]);
  res.json(tags);
});

router.post('/', authMiddleware, (req, res) => {
  const { name, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const id = insert('INSERT INTO tags (user_id, name, color) VALUES (?, ?, ?)', [req.userId, name.trim(), color || '#a855f7']);
  res.json({ id, name: name.trim(), color: color || '#a855f7' });
});

router.delete('/:id', authMiddleware, (req, res) => {
  run('DELETE FROM tags WHERE id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

router.get('/deck/:deckId', authMiddleware, (req, res) => {
  const tags = getAll('SELECT t.* FROM tags t JOIN deck_tags dt ON t.id = dt.tag_id WHERE dt.deck_id = ? AND t.user_id = ?', [req.params.deckId, req.userId]);
  res.json(tags);
});

router.post('/deck/:deckId', authMiddleware, (req, res) => {
  const { tagId } = req.body;
  if (!tagId) return res.status(400).json({ error: 'tagId required' });
  const tag = get('SELECT * FROM tags WHERE id = ? AND user_id = ?', [tagId, req.userId]);
  if (!tag) return res.status(404).json({ error: 'Tag not found' });
  try { insert('INSERT INTO deck_tags (deck_id, tag_id) VALUES (?, ?)', [req.params.deckId, tagId]); } catch {}
  res.json({ success: true });
});

router.delete('/deck/:deckId/:tagId', authMiddleware, (req, res) => {
  run('DELETE FROM deck_tags WHERE deck_id = ? AND tag_id = ?', [req.params.deckId, req.params.tagId]);
  res.json({ success: true });
});

export default router;
