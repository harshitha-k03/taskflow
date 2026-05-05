const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const chatbotController = require('../controllers/chatbotController');

// POST /api/chatbot — send a message to the AI assistant
router.post('/', protect, chatbotController.chat);

module.exports = router;
