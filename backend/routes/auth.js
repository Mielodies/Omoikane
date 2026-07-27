import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { get, getAll, insert, run } from '../db.js';
import { JWT_SECRET, authMiddleware } from '../middleware/auth.js';
import { sendPasswordResetEmail } from '../services/email.js';

const router = Router();

function sanitize(str) {
  return typeof str === 'string' ? str.trim() : '';
}

router.post('/register', (req, res) => {
  try {
    let { username, email, password } = req.body;
    username = sanitize(username);
    email = sanitize(email).toLowerCase();
    password = sanitize(password);

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (username.length < 2 || username.length > 30) {
      return res.status(400).json({ error: 'Username must be 2-30 characters' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and -' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existing = get('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
    if (existing) {
      return res.status(400).json({ error: 'Username or email already taken' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const userId = insert('INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)', [username, email, hash]);
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: userId, username, email } });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', (req, res) => {
  try {
    let { login, password } = req.body;
    login = sanitize(login);
    password = sanitize(password);

    if (!login || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const user = get('SELECT * FROM users WHERE username = ? OR email = ?', [login, login.toLowerCase()]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.json({ user: null });
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = get('SELECT id, username, email, created_at FROM users WHERE id = ?', [decoded.userId]);
    if (!user) return res.json({ user: null });
    res.json({ user });
  } catch {
    res.json({ user: null });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    let { login } = req.body;
    login = sanitize(login);

    if (!login) return res.status(400).json({ error: 'Enter your username or email' });

    const user = get('SELECT id, username, email FROM users WHERE username = ? OR email = ?', [login, login.toLowerCase()]);

    const genericMsg = { message: 'If an account exists, a reset link has been sent to the email on file.' };

    if (!user) return res.json(genericMsg);

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    insert('INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)', [user.id, token, expiresAt]);

    if (process.env.SMTP_USER) {
      try {
        await sendPasswordResetEmail(user.email, token);
        console.log(`Reset email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('Failed to send reset email:', emailErr.message);
      }
    } else {
      console.log(`\n=== PASSWORD RESET for ${user.username} (${user.email}) ===`);
      console.log(`Reset token: ${token}`);
      console.log(`Expires: ${expiresAt}\n`);
    }

    res.json(genericMsg);
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password', (req, res) => {
  try {
    let { token, newPassword } = req.body;
    token = sanitize(token);
    newPassword = sanitize(newPassword);

    if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const reset = get(
      'SELECT * FROM password_resets WHERE token = ? AND used = 0 AND expires_at > datetime("now")',
      [token]
    );
    if (!reset) return res.status(400).json({ error: 'Invalid or expired reset token' });

    const hash = bcrypt.hashSync(newPassword, 12);
    run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, reset.user_id]);
    run('UPDATE password_resets SET used = 1 WHERE id = ?', [reset.id]);

    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

router.post('/change-username', authMiddleware, (req, res) => {
  try {
    let { newUsername, password } = req.body;
    newUsername = sanitize(newUsername);
    password = sanitize(password);

    if (!newUsername || !password) return res.status(400).json({ error: 'All fields are required' });
    if (newUsername.length < 2 || newUsername.length > 30) return res.status(400).json({ error: 'Username must be 2-30 characters' });
    if (!/^[a-zA-Z0-9_-]+$/.test(newUsername)) return res.status(400).json({ error: 'Username can only contain letters, numbers, _ and -' });

    const user = get('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const existing = get('SELECT id FROM users WHERE username = ? AND id != ?', [newUsername, req.userId]);
    if (existing) return res.status(400).json({ error: 'Username already taken' });

    run('UPDATE users SET username = ? WHERE id = ?', [newUsername, req.userId]);
    const updated = get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
    res.json({ user: updated });
  } catch (err) {
    console.error('Change username error:', err);
    res.status(500).json({ error: 'Failed to change username' });
  }
});

router.post('/change-password', authMiddleware, (req, res) => {
  try {
    let { currentPassword, newPassword } = req.body;
    currentPassword = sanitize(currentPassword);
    newPassword = sanitize(newPassword);

    if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields are required' });
    if (newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = get('SELECT * FROM users WHERE id = ?', [req.userId]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    const hash = bcrypt.hashSync(newPassword, 12);
    run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.userId]);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

router.get('/stats', authMiddleware, (req, res) => {
  try {
    const user = get('SELECT id, username, email, created_at FROM users WHERE id = ?', [req.userId]);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const decks = getAll('SELECT id FROM decks WHERE user_id = ?', [req.userId]);
    const deckIds = decks.map(d => d.id);

    let totalCards = 0;
    let totalDue = 0;
    let totalMastered = 0;
    for (const id of deckIds) {
      const s = get(
        "SELECT COUNT(*) as total, SUM(CASE WHEN next_review <= datetime('now') THEN 1 ELSE 0 END) as due, SUM(CASE WHEN repetitions >= 3 THEN 1 ELSE 0 END) as mastered FROM cards WHERE deck_id = ?",
        [id]
      );
      totalCards += s.total || 0;
      totalDue += s.due || 0;
      totalMastered += s.mastered || 0;
    }

    const totalSessions = get('SELECT COUNT(*) as count FROM study_sessions WHERE user_id = ?', [req.userId]);
    const totalNotes = get('SELECT COUNT(*) as count FROM notes WHERE user_id = ?', [req.userId]);
    const totalBoards = get('SELECT COUNT(*) as count FROM whiteboards WHERE user_id = ?', [req.userId]);

    res.json({
      user,
      decks: decks.length,
      cards: totalCards,
      due: totalDue,
      mastered: totalMastered,
      sessions: totalSessions.count || 0,
      notes: totalNotes.count || 0,
      whiteboards: totalBoards.count || 0,
    });
  } catch (err) {
    console.error('Account stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

export default router;
