import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDB } from './db.js';
import authRouter from './routes/auth.js';
import documentsRouter from './routes/documents.js';
import decksRouter from './routes/decks.js';
import reviewRouter from './routes/review.js';
import whiteboardRouter from './routes/whiteboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

if (isProd) {
  const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
  app.use(express.static(frontendDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: isProd ? 'Internal server error' : err.message });
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down...');
  process.exit(0);
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Omoikane running on http://localhost:${PORT} [${isProd ? 'production' : 'development'}]`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
