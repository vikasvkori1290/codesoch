import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import quizRoutes from './routes/quizRoutes.js';
import authRoutes from './routes/authRoutes.js';
import srsRoutes from './routes/srsRoutes.js';
import leaderboardRoutes from './routes/leaderboardRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

import fs from 'fs';
import path from 'path';

// Load .env or .env.example
if (fs.existsSync(path.resolve(process.cwd(), '.env'))) {
  dotenv.config({ path: '.env' });
} else if (fs.existsSync(path.resolve(process.cwd(), '.env.example'))) {
  dotenv.config({ path: '.env.example' });
} else {
  dotenv.config();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/quiz', quizRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/srs', srsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/user', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'ThinkQuiz Backend Service', timestamp: new Date() });
});

// Error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Attempt database connection without crashing server if DB offline
connectDB().catch((err) => console.warn('[MongoDB Warning]: Running without database persistence.'));

app.listen(PORT, () => {
  console.log(`[ThinkQuiz Backend] Server running on http://localhost:${PORT}`);
});
