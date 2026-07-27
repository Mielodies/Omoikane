import { Router } from 'express';
import { get, getAll } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.get('/weak-cards', authMiddleware, (req, res) => {
  const cards = getAll(`
    SELECT c.*, d.title as deck_title FROM cards c 
    JOIN decks d ON c.deck_id = d.id 
    WHERE d.user_id = ? AND c.type = 'flashcard' AND c.times_reviewed > 0
    ORDER BY (CAST(c.times_correct AS REAL) / c.times_reviewed) ASC, c.times_reviewed DESC
    LIMIT 10
  `, [req.userId]);
  const recommendations = cards.map(c => ({
    ...c,
    accuracy: Math.round((c.times_correct / c.times_reviewed) * 100),
    priority: (1 - c.times_correct / c.times_reviewed) * c.times_reviewed,
  })).sort((a, b) => b.priority - a.priority);
  res.json(recommendations);
});

router.get('/suggestions', authMiddleware, (req, res) => {
  const totalCards = get('SELECT COUNT(*) as count FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = ?', [req.userId]);
  const dueCards = get("SELECT COUNT(*) as count FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = ? AND c.next_review <= datetime('now')", [req.userId]);
  const mastered = get('SELECT COUNT(*) as count FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = ? AND c.repetitions >= 3', [req.userId]);
  const suggestions = [];
  if (dueCards.count > 0) suggestions.push({ type: 'review', message: 'You have ' + dueCards.count + ' cards due for review', priority: 'high' });
  if (totalCards.count < 20) suggestions.push({ type: 'create', message: 'Add more cards to your decks for better learning', priority: 'medium' });
  if (mastered.count < totalCards.count * 0.3) suggestions.push({ type: 'practice', message: 'Focus on mastering more cards before adding new ones', priority: 'medium' });
  res.json(suggestions);
});

export default router;