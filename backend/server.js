import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { initDB } from './db.js';
import documentsRouter from './routes/documents.js';
import decksRouter from './routes/decks.js';
import reviewRouter from './routes/review.js';
import whiteboardRouter from './routes/whiteboard.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.use('/api/documents', documentsRouter);
app.use('/api/decks', decksRouter);
app.use('/api/review', reviewRouter);
app.use('/api/whiteboard', whiteboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Omoikane backend running on http://localhost:${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});
