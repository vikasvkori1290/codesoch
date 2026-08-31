import express from 'express';
import { getUserDashboardStats, deleteAccount } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/stats', protect, getUserDashboardStats);
router.delete('/delete', protect, deleteAccount);

export default router;
