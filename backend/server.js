import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB, get } from './db.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import decksRouter from './routes/decks.js';
import reviewRouter from './routes/review.js';
import whiteboardRouter from './routes/whiteboard.js';
import notesRouter from './routes/notes.js';
import boardsRouter from './routes/whiteboards.js';
import cardsRouter from './routes/cards.js';
import tagsRouter from './routes/tags.js';
import shareRouter from './routes/share.js';
import importExportRouter from './routes/importexport.js';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from './middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'omoikane-dev-secret-change-in-production') {
  if (isProd) {
    console.error('FATAL: Set JWT_SECRET to a strong random string in production!');
    process.exit(1);
  }
  console.warn('WARNING: Using default JWT_SECRET. Set JWT_SECRET in .env for production.');
}

if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your-key-here') {
  console.warn('WARNING: GROQ_API_KEY not set. AI features will not work.');
}

app.use(helmet({
  contentSecurityPolicy: isProd ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later' },
});
app.use('/api/', limiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 20 : 200,
  message: { error: 'Too many auth attempts, please try again later' },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

app.use(cors({
  origin: isProd ? false : true,
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api/auth', authRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/decks', decksRouter);
app.use('/api/review', reviewRouter);
app.use('/api/whiteboard', whiteboardRouter);
app.use('/api/notes', notesRouter);
app.use('/api/boards', boardsRouter);
app.use('/api/cards', cardsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/share', shareRouter);
app.use('/api/ie', importExportRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

if (isProd) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => { res.status(404).json({ error: 'Not found' }); });
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

const wss = new WebSocketServer({ server, path: '/ws' });

const rooms = new Map();

function broadcast(roomId, message, excludeId) {
  const room = rooms.get(roomId);
  if (!room) return;
  const data = JSON.stringify(message);
  for (const [id, client] of room.clients) {
    if (id !== excludeId && client.ws.readyState === 1) {
      client.ws.send(data);
    }
  }
}

function getRoomUsers(roomId) {
  const room = rooms.get(roomId);
  if (!room) return [];
  return Array.from(room.clients.values()).map((c) => ({
    id: c.id,
    username: c.username,
    color: c.color,
  }));
}

const USER_COLORS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#f97316'];

wss.on('connection', (ws, req) => {
  let userId = null;
  let username = 'Guest';
  const url = new URL(req.url, `http://${req.headers.host}`);
  const token = url.searchParams.get('token');
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      userId = decoded.userId;
      const user = get('SELECT username FROM users WHERE id = ?', [decoded.userId]);
      if (user) username = user.username;
    } catch {}
  }

  const clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const color = USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)];
  let currentRoom = null;

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const roomId = msg.boardId;
      if (!roomId) return;

      if (currentRoom) {
        const oldRoom = rooms.get(currentRoom);
        if (oldRoom) { oldRoom.clients.delete(clientId); broadcast(currentRoom, { type: 'user_left', userId: clientId, users: getRoomUsers(currentRoom) }); }
      }

      currentRoom = roomId;
      if (!rooms.has(roomId)) rooms.set(roomId, { clients: new Map(), canvasData: null });
      const room = rooms.get(roomId);
      room.clients.set(clientId, { ws, id: clientId, username, color });

      if (msg.canvasData) room.canvasData = msg.canvasData;

      ws.send(JSON.stringify({
        type: 'joined',
        clientId,
        users: getRoomUsers(roomId),
        canvasData: room.canvasData,
      }));

      broadcast(roomId, { type: 'user_joined', userId: clientId, username, color, users: getRoomUsers(roomId) }, clientId);
    }

    if (msg.type === 'draw' && currentRoom) {
      broadcast(currentRoom, { type: 'draw', data: msg.data, userId: clientId }, clientId);
    }

    if (msg.type === 'cursor' && currentRoom) {
      broadcast(currentRoom, { type: 'cursor', x: msg.x, y: msg.y, userId: clientId, username, color }, clientId);
    }

    if (msg.type === 'canvas_update' && currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) room.canvasData = msg.canvasData;
    }

    if (msg.type === 'clear' && currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) room.canvasData = null;
      broadcast(currentRoom, { type: 'clear', userId: clientId });
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.clients.delete(clientId);
        broadcast(currentRoom, { type: 'user_left', userId: clientId, users: getRoomUsers(currentRoom) });
        if (room.clients.size === 0) rooms.delete(currentRoom);
      }
    }
  });
});

initDB().then(() => {
  server.listen(PORT, () => {
    console.log(`Omoikane running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));
