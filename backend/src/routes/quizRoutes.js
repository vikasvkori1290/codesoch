import express from 'express';
import { generateQuiz, getQuizById, submitQuiz } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public quiz generation endpoint
router.post('/generate', generateQuiz);
router.get('/:id', getQuizById);
router.post('/submit', protect, submitQuiz);

export default router;
