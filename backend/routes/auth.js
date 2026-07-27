import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { get, insert } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';

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
    if (password.length > 128) {
      return res.status(400).json({ error: 'Password too long' });
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
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!bcrypt.compareSync(password, user.password_hash)) {
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
  if (!header || !header.startsWith('Bearer ')) {
    return res.json({ user: null });
  }

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

export default router;
