import api from './client';

export const sendChatbotMessage = (message, history = []) =>
  api.post('/chatbot', { message, history });
