import express from 'express';
import { generateQuiz, getQuizById, submitQuiz, recordQuizSubmission } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public quiz generation endpoint
router.post('/generate', generateQuiz);
router.post('/record-submission', protect, recordQuizSubmission);
router.get('/:id', getQuizById);
router.post('/submit', protect, submitQuiz);

export default router;
