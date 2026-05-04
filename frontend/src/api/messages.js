import api from './client';

// Get paginated message history for a channel
export const getMessages = (channel, page = 1, limit = 50) =>
  api.get(`/messages/${encodeURIComponent(channel)}`, { params: { page, limit } });

// Send a message to a channel
export const sendMessage = (channel, text) =>
  api.post('/messages', { channel, text });

// Mark all messages in a channel as read
export const markChannelRead = (channel) =>
  api.patch(`/messages/read/${encodeURIComponent(channel)}`);

// Get unread counts per channel
export const getUnreadCounts = () =>
  api.get('/messages/unread/counts');
