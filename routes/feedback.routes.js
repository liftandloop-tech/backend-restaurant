//new
const express = require("express");
const feedbackController = require("../controllers/feedbackController.js");
const { authMiddleware } = require("../middlewares/auth.js");

const router = express.Router();

// Public route for customers to submit feedback
router.post('/submit', feedbackController.submitfeedback);

// Private route for admin to see feedbacks
router.get('/all', authMiddleware, feedbackController.getFeedbacks);

module.exports = router;
