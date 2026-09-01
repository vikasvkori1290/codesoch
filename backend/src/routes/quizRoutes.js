import express from 'express';
import { generateQuiz, getQuizById, submitQuiz, recordQuizSubmission, getActiveProblem, syncActiveProblem } from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Specific routes MUST come before generic parameterized :id route
router.post('/generate', generateQuiz);
router.get('/active-problem', protect, getActiveProblem);
router.post('/sync-active-problem', protect, syncActiveProblem);
router.post('/record-submission', protect, recordQuizSubmission);
router.post('/submit', protect, submitQuiz);

// Parameterized route (MUST be last)
router.get('/:id', getQuizById);

export default router;