import { Router } from 'express';
import crypto from 'crypto';
import { get, getAll, insert, run } from '../db.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.post('/groups', authMiddleware, (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const inviteCode = crypto.randomBytes(4).toString('hex');
  const id = insert('INSERT INTO study_groups (name, owner_id, invite_code) VALUES (?, ?, ?)', [name, req.userId, inviteCode]);
  insert('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [id, req.userId]);
  res.json({ id, name, invite_code: inviteCode });
});

router.get('/groups', authMiddleware, (req, res) => {
  const groups = getAll('SELECT sg.*, (SELECT COUNT(*) FROM group_members WHERE group_id = sg.id) as member_count FROM study_groups sg JOIN group_members gm ON sg.id = gm.group_id WHERE gm.user_id = ?', [req.userId]);
  res.json(groups);
});

router.post('/groups/join', authMiddleware, (req, res) => {
  const { inviteCode } = req.body;
  if (!inviteCode) return res.status(400).json({ error: 'Invite code required' });
  const group = get('SELECT * FROM study_groups WHERE invite_code = ?', [inviteCode]);
  if (!group) return res.status(404).json({ error: 'Group not found' });
  try { insert('INSERT INTO group_members (group_id, user_id) VALUES (?, ?)', [group.id, req.userId]); } catch {}
  res.json({ group });
});

router.get('/groups/:id', authMiddleware, (req, res) => {
  const group = get('SELECT * FROM study_groups WHERE id = ?', [req.params.id]);
  if (!group) return res.status(404).json({ error: 'Not found' });
  const members = getAll('SELECT u.id, u.username, COALESCE(ux.xp,0) as xp, COALESCE(ux.level,1) as level, COALESCE(ux.title,\'Novice\') as title FROM users u JOIN group_members gm ON u.id = gm.user_id LEFT JOIN user_xp ux ON u.id = ux.user_id WHERE gm.group_id = ?', [req.params.id]);
  res.json({ group, members });
});

router.delete('/groups/:id', authMiddleware, (req, res) => {
  const group = get('SELECT * FROM study_groups WHERE id = ? AND owner_id = ?', [req.params.id, req.userId]);
  if (!group) return res.status(404).json({ error: 'Not found' });
  run('DELETE FROM group_members WHERE group_id = ?', [req.params.id]);
  run('DELETE FROM study_groups WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

router.post('/groups/:id/leave', authMiddleware, (req, res) => {
  run('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [req.params.id, req.userId]);
  res.json({ success: true });
});

router.get('/marketplace', (req, res) => {
  const { q, sort } = req.query;
  let sql = 'SELECT pd.*, d.title, d.card_count, u.username as author FROM public_decks pd JOIN decks d ON pd.deck_id = d.id JOIN users u ON pd.user_id = u.id';
  const params = [];
  if (q) { sql += ' WHERE d.title LIKE ?'; params.push('%' + q + '%'); }
  sql += sort === 'downloads' ? ' ORDER BY pd.downloads DESC' : sort === 'rating' ? ' ORDER BY pd.rating DESC' : ' ORDER BY pd.created_at DESC';
  sql += ' LIMIT 50';
  res.json(getAll(sql, params));
});

router.post('/marketplace/publish', authMiddleware, (req, res) => {
  const { deckId, description } = req.body;
  const deck = get('SELECT * FROM decks WHERE id = ? AND user_id = ?', [deckId, req.userId]);
  if (!deck) return res.status(404).json({ error: 'Deck not found' });
  try { insert('INSERT INTO public_decks (deck_id, user_id, description) VALUES (?, ?, ?)', [deckId, req.userId, description || '']); }
  catch { return res.status(400).json({ error: 'Already published' }); }
  res.json({ success: true });
});

router.post('/marketplace/download/:id', (req, res) => {
  const pub = get('SELECT * FROM public_decks WHERE id = ?', [req.params.id]);
  if (!pub) return res.status(404).json({ error: 'Not found' });
  run('UPDATE public_decks SET downloads = downloads + 1 WHERE id = ?', [req.params.id]);
  const deck = get('SELECT * FROM decks WHERE id = ?', [pub.deck_id]);
  const cards = getAll('SELECT type, question, answer, options FROM cards WHERE deck_id = ?', [pub.deck_id]);
  res.json({ deck, cards });
});

router.delete('/marketplace/:deckId', authMiddleware, (req, res) => {
  run('DELETE FROM public_decks WHERE deck_id = ? AND user_id = ?', [req.params.deckId, req.userId]);
  res.json({ success: true });
});

router.get('/profile/:userId', (req, res) => {
  const user = get('SELECT id, username, created_at FROM users WHERE id = ?', [req.params.userId]);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const profile = get('SELECT * FROM user_profiles WHERE user_id = ?', [req.params.userId]);
  const xp = get('SELECT * FROM user_xp WHERE user_id = ?', [req.params.userId]);
  const achievements = getAll('SELECT badge_id, unlocked_at FROM achievements WHERE user_id = ?', [req.params.userId]);
  const deckCount = get('SELECT COUNT(*) as count FROM decks WHERE user_id = ?', [req.params.userId]);
  const publicDecks = getAll('SELECT pd.*, d.title, d.card_count FROM public_decks pd JOIN decks d ON pd.deck_id = d.id WHERE pd.user_id = ?', [req.params.userId]);
  res.json({ user, profile: profile || { bio: '', avatar_color: '#a855f7' }, xp, achievements, deckCount: deckCount.count, publicDecks });
});

router.put('/profile', authMiddleware, (req, res) => {
  const { bio, avatar_color, is_public } = req.body;
  const existing = get('SELECT * FROM user_profiles WHERE user_id = ?', [req.userId]);
  if (existing) {
    run('UPDATE user_profiles SET bio = ?, avatar_color = ?, is_public = ? WHERE user_id = ?',
      [bio !== undefined ? bio : existing.bio, avatar_color || existing.avatar_color, is_public !== undefined ? (is_public ? 1 : 0) : existing.is_public, req.userId]);
  } else {
    insert('INSERT INTO user_profiles (user_id, bio, avatar_color, is_public) VALUES (?, ?, ?, ?)',
      [req.userId, bio || '', avatar_color || '#a855f7', is_public ? 1 : 0]);
  }
  res.json({ success: true });
});

router.get('/leaderboard', (req, res) => {
  const { type } = req.query;
  let sql;
  if (type === 'streak') {
    sql = 'SELECT u.id, u.username, COALESCE(ux.xp,0) as xp, COALESCE(ux.level,1) as level, COALESCE(ux.title,\'Novice\') as title, (SELECT COUNT(*) FROM study_days WHERE user_id = u.id) as days_studied FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id ORDER BY days_studied DESC LIMIT 20';
  } else if (type === 'mastered') {
    sql = 'SELECT u.id, u.username, COALESCE(ux.xp,0) as xp, COALESCE(ux.level,1) as level, COALESCE(ux.title,\'Novice\') as title, (SELECT COUNT(*) FROM cards c JOIN decks d ON c.deck_id = d.id WHERE d.user_id = u.id AND c.repetitions >= 3) as mastered FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id ORDER BY mastered DESC LIMIT 20';
  } else {
    sql = 'SELECT u.id, u.username, COALESCE(ux.xp,0) as xp, COALESCE(ux.level,1) as level, COALESCE(ux.title,\'Novice\') as title FROM users u LEFT JOIN user_xp ux ON u.id = ux.user_id ORDER BY COALESCE(ux.xp, 0) DESC LIMIT 20';
  }
  res.json(getAll(sql));
});

export default router;