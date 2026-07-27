import { Router } from 'express';
import { run, get, getAll, insert } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const notes = getAll(
    'SELECT id, title, body, created_at, updated_at FROM notes WHERE user_id = ? ORDER BY updated_at DESC',
    [req.userId]
  );
  res.json(notes);
});

router.get('/:id', authMiddleware, (req, res) => {
  const note = get(
    'SELECT id, title, body, created_at, updated_at FROM notes WHERE id = ? AND user_id = ?',
    [parseInt(req.params.id), req.userId]
  );
  if (!note) return res.status(404).json({ error: 'Note not found' });
  res.json(note);
});

router.post('/', authMiddleware, (req, res) => {
  const { title, body } = req.body;
  const noteId = insert(
    'INSERT INTO notes (user_id, title, body) VALUES (?, ?, ?)',
    [req.userId, title || 'Untitled Note', body || '']
  );
  const note = get('SELECT id, title, body, created_at, updated_at FROM notes WHERE id = ?', [noteId]);
  res.json(note);
});

router.put('/:id', authMiddleware, (req, res) => {
  const note = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  const { title, body } = req.body;
  run(
    'UPDATE notes SET title = ?, body = ?, updated_at = datetime("now") WHERE id = ?',
    [title ?? note.title, body ?? note.body, note.id]
  );
  const updated = get('SELECT id, title, body, created_at, updated_at FROM notes WHERE id = ?', [note.id]);
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const note = get('SELECT * FROM notes WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
  if (!note) return res.status(404).json({ error: 'Note not found' });
  run('DELETE FROM notes WHERE id = ?', [note.id]);
  res.json({ success: true });
});

export default router;
