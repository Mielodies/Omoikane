import { Router } from 'express';
import { run, get, getAll, insert } from '../db.js';

const router = Router();

function sm2(card, quality) {
  let { ease_factor, interval, repetitions } = card;

  if (quality >= 3) {
    if (repetitions === 0) interval = 1;
    else if (repetitions === 1) interval = 6;
    else interval = Math.round(interval * ease_factor);
    repetitions += 1;
  } else {
    repetitions = 0;
    interval = 1;
  }

  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (ease_factor < 1.3) ease_factor = 1.3;

  const now = new Date();
  const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

  return { ease_factor, interval, repetitions, next_review: nextReview.toISOString() };
}

router.get('/due/:deckId', (req, res) => {
  const cards = getAll(
    "SELECT * FROM cards WHERE deck_id = ? AND next_review <= datetime('now') ORDER BY RANDOM()",
    [parseInt(req.params.deckId)]
  );
  res.json(cards);
});

router.get('/all/:deckId', (req, res) => {
  const cards = getAll(
    'SELECT * FROM cards WHERE deck_id = ? ORDER BY type, RANDOM()',
    [parseInt(req.params.deckId)]
  );
  res.json(cards);
});

router.post('/', (req, res) => {
  const { cardId, quality, isCorrect } = req.body;

  const card = get('SELECT * FROM cards WHERE id = ?', [cardId]);
  if (!card) return res.status(404).json({ error: 'Card not found' });

  const update = sm2(card, quality);

  run(`
    UPDATE cards SET
      ease_factor = ?,
      interval = ?,
      repetitions = ?,
      next_review = ?,
      last_reviewed = datetime('now'),
      times_reviewed = times_reviewed + 1,
      times_correct = times_correct + ?
    WHERE id = ?
  `, [update.ease_factor, update.interval, update.repetitions, update.next_review, isCorrect ? 1 : 0, cardId]);

  res.json({ success: true, nextReview: update.next_review });
});

router.post('/session', (req, res) => {
  const { deckId, cardsStudied, correctCount } = req.body;

  const sessionId = insert(
    'INSERT INTO sessions (deck_id, cards_studied, correct_count, ended_at) VALUES (?, ?, ?, datetime("now"))',
    [deckId, cardsStudied, correctCount]
  );

  res.json({ sessionId });
});

router.get('/stats', (req, res) => {
  const decks = getAll('SELECT * FROM decks ORDER BY created_at DESC');
  let totalCards = 0;
  let totalDue = 0;
  let totalMastered = 0;

  for (const deck of decks) {
    const stats = get(
      "SELECT COUNT(*) as total, SUM(CASE WHEN next_review <= datetime('now') THEN 1 ELSE 0 END) as due, SUM(CASE WHEN repetitions >= 3 THEN 1 ELSE 0 END) as mastered FROM cards WHERE deck_id = ?",
      [deck.id]
    );
    totalCards += stats.total || 0;
    totalDue += stats.due || 0;
    totalMastered += stats.mastered || 0;
  }

  res.json({ totalCards, totalDue, totalMastered, totalDecks: decks.length });
});

export default router;
