import { Router } from 'express';
import { run, get, getAll } from '../db.js';

const router = Router();

router.get('/', (req, res) => {
  const decks = getAll('SELECT * FROM decks ORDER BY created_at DESC');
  res.json(decks);
});

router.get('/:id', (req, res) => {
  const deck = get('SELECT * FROM decks WHERE id = ?', [parseInt(req.params.id)]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });

  const cards = getAll('SELECT * FROM cards WHERE deck_id = ?', [parseInt(req.params.id)]);
  res.json({ deck, cards });
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM decks WHERE id = ?', [parseInt(req.params.id)]);
  res.json({ success: true });
});

router.get('/:id/stats', (req, res) => {
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

export default router;
