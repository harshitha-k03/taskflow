const chatbotService = require('../utils/chatbotService');

// POST /api/chatbot
exports.chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required.',
      });
    }

    if (message.trim().length > 2000) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot exceed 2000 characters.',
      });
    }

    // Sanitize conversation history (optional array of {role, content})
    const conversationHistory = Array.isArray(history)
      ? history
          .filter(
            (m) =>
              m &&
              typeof m.role === 'string' &&
              typeof m.content === 'string' &&
              ['user', 'assistant'].includes(m.role)
          )
          .slice(-6)
      : [];

    const { reply, provider } = await chatbotService.chat(
      req.user._id,
      message.trim(),
      conversationHistory
    );

    res.json({
      success: true,
      data: {
        reply,
        provider, // useful for debugging which provider answered
      },
    });
  } catch (err) {
    next(err);
  }
};
