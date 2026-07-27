import { Router } from 'express';
import { get, getAll, insert, run } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

const LEVELS = [0,100,250,500,1000,2000,3500,5000,7500,10000,15000,20000,30000,50000];
const TITLES = ['Novice','Apprentice','Student','Scholar','Adept','Expert','Master','Sage','Grandmaster','Legend','Mythic','Transcendent','Divine','Omoikane'];

const ACHIEVEMENTS = [
  { id: 'first_card', name: 'First Steps', desc: 'Review your first card' },
  { id: 'cards_50', name: 'Getting Started', desc: 'Review 50 cards' },
  { id: 'cards_100', name: 'Centurion', desc: 'Review 100 cards' },
  { id: 'cards_500', name: 'Scholar', desc: 'Review 500 cards' },
  { id: 'cards_1000', name: 'Card Master', desc: 'Review 1000 cards' },
  { id: 'streak_3', name: 'On Fire', desc: '3-day streak' },
  { id: 'streak_7', name: 'Dedicated', desc: '7-day streak' },
  { id: 'streak_30', name: 'Unstoppable', desc: '30-day streak' },
  { id: 'perfect_session', name: 'Flawless', desc: '100% accuracy in a session' },
  { id: 'speed_demon', name: 'Speed Demon', desc: 'Review 20 cards in under 5 min' },
  { id: 'night_owl', name: 'Night Owl', desc: 'Study after midnight' },
  { id: 'early_bird', name: 'Early Bird', desc: 'Study before 7AM' },
  { id: 'first_deck', name: 'Creator', desc: 'Create your first deck' },
  { id: 'decks_10', name: 'Collector', desc: 'Own 10 decks' },
  { id: 'share_first', name: 'Generous', desc: 'Share a deck publicly' },
  { id: 'group_join', name: 'Team Player', desc: 'Join a study group' },
  { id: 'mastered_50', name: 'Mastery', desc: 'Master 50 cards' },
  { id: 'level_5', name: 'Rising Star', desc: 'Reach level 5' },
  { id: 'level_10', name: 'Veteran', desc: 'Reach level 10' },
  { id: 'daily_7', name: 'Challenger', desc: 'Complete 7 daily challenges' },
];

function getXpForLevel(level) {
  return LEVELS[Math.min(level, LEVELS.length - 1)] || LEVELS[LEVELS.length - 1];
}

function calculateStreak(userId) {
  const days = getAll('SELECT study_date FROM study_days WHERE user_id = ? ORDER BY study_date DESC', [userId]);
  if (days.length === 0) return 0;
  let streak = 0;
  let current = new Date();
  for (const day of days) {
    const d = new Date(day.study_date);
    const diff = Math.floor((current - d) / (1000 * 60 * 60 * 24));
    if (diff <= streak + 1) { streak = Math.max(streak, diff + 1); current = d; }
    else break;
  }
  return streak;
}

function awardXP(userId, amount) {
  let profile = get('SELECT * FROM user_xp WHERE user_id = ?', [userId]);
  if (!profile) {
    insert('INSERT INTO user_xp (user_id, xp, level, title) VALUES (?, 0, 1, ?)', [userId, TITLES[0]]);
    profile = get('SELECT * FROM user_xp WHERE user_id = ?', [userId]);
  }
  const newXp = profile.xp + amount;
  let newLevel = profile.level;
  while (newXp >= getXpForLevel(newLevel + 1) && newLevel < TITLES.length - 1) newLevel++;
  const newTitle = TITLES[Math.min(newLevel - 1, TITLES.length - 1)];
  run('UPDATE user_xp SET xp = ?, level = ?, title = ? WHERE user_id = ?', [newXp, newLevel, newTitle, userId]);
  return { xp: newXp, level: newLevel, title: newTitle, leveledUp: newLevel > profile.level };
}

function checkAndUnlock(userId, badgeId) {
  const existing = get('SELECT id FROM achievements WHERE user_id = ? AND badge_id = ?', [userId, badgeId]);
  if (!existing) { insert('INSERT INTO achievements (user_id, badge_id) VALUES (?, ?)', [userId, badgeId]); return true; }
  return false;
}

router.get('/profile', authMiddleware, (req, res) => {
  let profile = get('SELECT * FROM user_xp WHERE user_id = ?', [req.userId]);
  if (!profile) {
    insert('INSERT INTO user_xp (user_id) VALUES (?)', [req.userId]);
    profile = get('SELECT * FROM user_xp WHERE user_id = ?', [req.userId]);
  }
  const achievements = getAll('SELECT badge_id, unlocked_at FROM achievements WHERE user_id = ?', [req.userId]);
  const nextLevelXp = getXpForLevel(profile.level + 1);
  const currentLevelXp = getXpForLevel(profile.level);
  const challenges = getAll('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = date("now")', [req.userId]);
  res.json({ ...profile, achievements, nextLevelXp, currentLevelXp, challenges, allAchievements: ACHIEVEMENTS });
});

router.post('/xp', authMiddleware, (req, res) => {
  const { amount } = req.body;
  const result = awardXP(req.userId, amount || 10);
  const totalReviewed = get('SELECT COALESCE(SUM(times_reviewed),0) as count FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id = ?)', [req.userId]);
  const totalMastered = get('SELECT COUNT(*) as count FROM cards WHERE deck_id IN (SELECT id FROM decks WHERE user_id = ?) AND repetitions >= 3', [req.userId]);
  const streak = calculateStreak(req.userId);
  if (totalReviewed.count >= 1) checkAndUnlock(req.userId, 'first_card');
  if (totalReviewed.count >= 50) checkAndUnlock(req.userId, 'cards_50');
  if (totalReviewed.count >= 100) checkAndUnlock(req.userId, 'cards_100');
  if (totalReviewed.count >= 500) checkAndUnlock(req.userId, 'cards_500');
  if (totalReviewed.count >= 1000) checkAndUnlock(req.userId, 'cards_1000');
  if (streak >= 3) checkAndUnlock(req.userId, 'streak_3');
  if (streak >= 7) checkAndUnlock(req.userId, 'streak_7');
  if (streak >= 30) checkAndUnlock(req.userId, 'streak_30');
  if (totalMastered.count >= 50) checkAndUnlock(req.userId, 'mastered_50');
  if (result.level >= 5) checkAndUnlock(req.userId, 'level_5');
  if (result.level >= 10) checkAndUnlock(req.userId, 'level_10');
  const hour = new Date().getHours();
  if (hour >= 0 && hour < 5) checkAndUnlock(req.userId, 'night_owl');
  if (hour >= 5 && hour < 7) checkAndUnlock(req.userId, 'early_bird');
  const updatedAchievements = getAll('SELECT badge_id, unlocked_at FROM achievements WHERE user_id = ?', [req.userId]);
  res.json({ ...result, achievements: updatedAchievements });
});

router.get('/challenges', authMiddleware, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  let challenges = getAll('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ?', [req.userId, today]);
  if (challenges.length === 0) {
    const types = [
      { type: 'review_cards', target: 15 + Math.floor(Math.random() * 20), reward: 50 },
      { type: 'accuracy', target: 80 + Math.floor(Math.random() * 20), reward: 75 },
      { type: 'study_time', target: 10 + Math.floor(Math.random() * 20), reward: 60 },
    ];
    for (const c of types) {
      insert('INSERT INTO daily_challenges (user_id, challenge_date, challenge_type, target, xp_reward) VALUES (?, ?, ?, ?, ?)',
        [req.userId, today, c.type, c.target, c.reward]);
    }
    challenges = getAll('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ?', [req.userId, today]);
  }
  res.json(challenges);
});

router.post('/challenges/progress', authMiddleware, (req, res) => {
  const { type, progress } = req.body;
  const today = new Date().toISOString().split('T')[0];
  const challenge = get('SELECT * FROM daily_challenges WHERE user_id = ? AND challenge_date = ? AND challenge_type = ?',
    [req.userId, today, type]);
  if (!challenge) return res.json({ ok: true });
  const newProgress = challenge.progress + (progress || 1);
  const completed = newProgress >= challenge.target ? 1 : 0;
  run('UPDATE daily_challenges SET progress = ?, completed = ? WHERE id = ?', [newProgress, completed, challenge.id]);
  if (completed && !challenge.completed) awardXP(req.userId, challenge.xp_reward);
  res.json({ progress: newProgress, completed: !!completed });
});

export default router;