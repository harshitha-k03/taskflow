const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Message = require('../models/Message');
const Ably = require('ably');

// Lazy-init Ably REST client (server-side publishing)
let ablyRest = null;
const getAbly = () => {
  if (!ablyRest && process.env.ABLY_API_KEY) {
    ablyRest = new Ably.Rest({ key: process.env.ABLY_API_KEY });
  }
  return ablyRest;
};

router.use(protect);

// ── STATIC routes FIRST (before /:channel param) ──────────────────────────

// GET /api/messages/unread/counts — unread counts per channel for current user
router.get('/unread/counts', async (req, res, next) => {
  try {
    const counts = await Message.aggregate([
      { $match: { readBy: { $ne: req.user._id } } },
      { $group: { _id: '$channel', count: { $sum: 1 } } },
    ]);
    const map = counts.reduce((acc, c) => { acc[c._id] = c.count; return acc; }, {});
    res.json({ success: true, data: map });
  } catch (err) {
    next(err);
  }
});

// POST /api/messages — save message + publish via Ably
router.post('/', async (req, res, next) => {
  try {
    const { channel, text } = req.body;
    if (!channel || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Channel and text are required.' });
    }

    const message = await Message.create({
      sender: req.user._id,
      channel,
      text: text.trim(),
      readBy: [req.user._id],
    });

    const populated = await Message.findById(message._id)
      .populate('sender', 'name email avatar availability')
      .lean();

    // Publish to Ably channel in real-time
    const ably = getAbly();
    if (ably) {
      try {
        // 1. Publish to the chat channel (for live chat view)
        const ablyChannel = ably.channels.get(channel);
        ablyChannel.publish('message', populated);

        // 2. Publish to user-specific notification channels (for global toast)
        const notifyPayload = {
          channel,
          channelLabel: channel.startsWith('team:') ? channel.replace('team:', '') : '',
          senderId: req.user._id.toString(),
          senderName: req.user.name,
          text: text.trim(),
        };

        if (channel.startsWith('dm:')) {
          // DM: notify the other user
          const ids = channel.replace('dm:', '').split('_');
          const otherId = ids.find((id) => id !== req.user._id.toString());
          if (otherId) {
            ably.channels.get(`notify:${otherId}`).publish('new_message', notifyPayload);
          }
        } else if (channel.startsWith('team:')) {
          // Team: notify all project members
          const projectId = channel.replace('team:', '');
          const TeamMember = require('../models/TeamMember');
          const members = await TeamMember.find({ project: projectId }).select('user').lean();
          // Get project name for the label
          const Project = require('../models/Project');
          const proj = await Project.findById(projectId).select('name').lean();
          notifyPayload.channelLabel = proj?.name || projectId;

          members.forEach((m) => {
            const uid = m.user.toString();
            if (uid !== req.user._id.toString()) {
              ably.channels.get(`notify:${uid}`).publish('new_message', notifyPayload);
            }
          });
        }
      } catch (ablyErr) {
        console.error('[Ably] Publish error:', ablyErr.message);
      }
    }

    res.status(201).json({ success: true, data: populated });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/messages/read/:channel — mark all messages in channel as read
router.patch('/read/:channel', async (req, res, next) => {
  try {
    const { channel } = req.params;
    await Message.updateMany(
      { channel, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// ── PARAMETERIZED route LAST ──────────────────────────────────────────────

// GET /api/messages/:channel — paginated message history
router.get('/:channel', async (req, res, next) => {
  try {
    const { channel } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channel })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('sender', 'name email avatar availability')
      .lean();

    const total = await Message.countDocuments({ channel });

    res.json({
      success: true,
      data: messages.reverse(),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
