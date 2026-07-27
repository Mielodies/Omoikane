import { Router } from 'express';
import { run, get, getAll, insert } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  const boards = getAll(
    'SELECT id, name, created_at, updated_at FROM whiteboards WHERE user_id = ? ORDER BY updated_at DESC',
    [req.userId]
  );
  res.json(boards);
});

router.get('/:id', authMiddleware, (req, res) => {
  const board = get(
    'SELECT id, name, canvas_data, created_at, updated_at FROM whiteboards WHERE id = ? AND user_id = ?',
    [parseInt(req.params.id), req.userId]
  );
  if (!board) return res.status(404).json({ error: 'Whiteboard not found' });
  res.json(board);
});

router.post('/', authMiddleware, (req, res) => {
  const { name, canvas_data } = req.body;
  const boardId = insert(
    'INSERT INTO whiteboards (user_id, name, canvas_data) VALUES (?, ?, ?)',
    [req.userId, name || 'Untitled Whiteboard', canvas_data || null]
  );
  const board = get('SELECT id, name, created_at, updated_at FROM whiteboards WHERE id = ?', [boardId]);
  res.json(board);
});

router.put('/:id', authMiddleware, (req, res) => {
  const board = get('SELECT * FROM whiteboards WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
  if (!board) return res.status(404).json({ error: 'Whiteboard not found' });

  const { name, canvas_data } = req.body;
  run(
    'UPDATE whiteboards SET name = ?, canvas_data = ?, updated_at = datetime("now") WHERE id = ?',
    [name ?? board.name, canvas_data ?? board.canvas_data, board.id]
  );
  const updated = get('SELECT id, name, created_at, updated_at FROM whiteboards WHERE id = ?', [board.id]);
  res.json(updated);
});

router.delete('/:id', authMiddleware, (req, res) => {
  const board = get('SELECT * FROM whiteboards WHERE id = ? AND user_id = ?', [parseInt(req.params.id), req.userId]);
  if (!board) return res.status(404).json({ error: 'Whiteboard not found' });
  run('DELETE FROM whiteboards WHERE id = ?', [board.id]);
  res.json({ success: true });
});

export default router;
