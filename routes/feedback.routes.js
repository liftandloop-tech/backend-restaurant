//new
import express from 'express';
import * as feedbackController from '../controllers/feedbackController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Public route for customers to submit feedback
router.post('/submit', feedbackController.submitfeedback);

// Private route for admin to see feedbacks
router.get('/all', authMiddleware, feedbackController.getFeedbacks);

export default router;
