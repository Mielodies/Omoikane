import { Router } from 'express';
import { run, get, getAll } from '../db.js';
import { authMiddleware, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, (req, res) => {
  let decks;
  if (req.userId) {
    decks = getAll('SELECT * FROM decks WHERE user_id = ? ORDER BY created_at DESC', [req.userId]);
  } else {
    decks = getAll('SELECT * FROM decks WHERE user_id IS NULL ORDER BY created_at DESC');
  }
  res.json(decks);
});

router.get('/:id', optionalAuth, (req, res) => {
  const deck = get('SELECT * FROM decks WHERE id = ?', [parseInt(req.params.id)]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  if (req.userId && deck.user_id && deck.user_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  const cards = getAll('SELECT * FROM cards WHERE deck_id = ?', [parseInt(req.params.id)]);
  res.json({ deck, cards });
});

router.delete('/:id', optionalAuth, (req, res) => {
  const deck = get('SELECT * FROM decks WHERE id = ?', [parseInt(req.params.id)]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  if (req.userId && deck.user_id && deck.user_id !== req.userId) {
    return res.status(403).json({ error: 'Access denied' });
  }

  run('DELETE FROM decks WHERE id = ?', [parseInt(req.params.id)]);
  res.json({ success: true });
});

router.get('/:id/stats', optionalAuth, (req, res) => {
  const deckId = parseInt(req.params.id);
  const deck = get('SELECT * FROM decks WHERE id = ?', [deckId]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const totalCards = get('SELECT COUNT(*) as count FROM cards WHERE deck_id = ?', [deckId]).count;
  const dueToday = get(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND next_review <= datetime('now')",
    [deckId]
  ).count;
  const mastered = get(
    'SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND repetitions >= 3',
    [deckId]
  ).count;
  const flashcardCount = get(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND type = 'flashcard'",
    [deckId]
  ).count;
  const quizCount = get(
    "SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND type = 'quiz'",
    [deckId]
  ).count;

  const sessions = getAll(
    'SELECT * FROM sessions WHERE deck_id = ? ORDER BY started_at DESC LIMIT 10',
    [deckId]
  );

  let totalReviewed = 0;
  let totalCorrect = 0;
  for (const s of sessions) {
    totalReviewed += s.cards_studied;
    totalCorrect += s.correct_count;
  }
  const accuracy = totalReviewed > 0 ? Math.round((totalCorrect / totalReviewed) * 100) : 0;

  const streak = sessions.filter((s) => s.correct_count > 0).length;

  res.json({
    totalCards,
    dueToday,
    mastered,
    flashcardCount,
    quizCount,
    accuracy,
    streak,
    sessionsCount: sessions.length,
  });
});

router.get('/search', authMiddleware, (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ decks: [], cards: [] });

  const term = `%${q}%`;
  const decks = getAll('SELECT * FROM decks WHERE user_id = ? AND title LIKE ?', [req.userId, term]);

  const deckIds = decks.map(d => d.id);
  let cards = [];
  if (deckIds.length) {
    const placeholders = deckIds.map(() => '?').join(',');
    cards = getAll(`SELECT c.*, c.deck_id as deckId FROM cards c WHERE c.deck_id IN (${placeholders}) AND (c.question LIKE ? OR c.answer LIKE ?)`,
      [...deckIds, term, term]);
  }

  res.json({ decks, cards });
});

export default router;
