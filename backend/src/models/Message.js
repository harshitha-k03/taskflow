const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    channel: {
      type: String,
      required: true,
      index: true,
      // 'team:{projectId}' for team chat, 'dm:{sortedUserIds}' for DMs
    },
    text: {
      type: String,
      required: [true, 'Message cannot be empty'],
      trim: true,
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

// Compound index for efficient channel + time queries
messageSchema.index({ channel: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
