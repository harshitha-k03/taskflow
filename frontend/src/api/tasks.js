import api from './client';

export const getTasks = (params) => api.get('/tasks', { params });
export const getProjectTasks = (projectId, params) =>
  api.get(`/projects/${projectId}/tasks`, { params });
export const getTask = (id) => api.get(`/tasks/${id}`);
export const createTask = (data) => api.post('/tasks', data);
export const updateTask = (id, data) => api.put(`/tasks/${id}`, data);
export const deleteTask = (id) => api.delete(`/tasks/${id}`);
export const updateTaskStatus = (id, status) => api.patch(`/tasks/${id}/status`, { status });
export const assignTask = (id, assignedTo) => api.patch(`/tasks/${id}/assign`, { assignedTo });
export const addComment = (id, text) => api.post(`/tasks/${id}/comments`, { text });
export const getDashboard = () => api.get('/analytics/dashboard');
export const getTeamOverview = () => api.get('/analytics/team-overview');
export const updateAvailability = (status) => api.patch('/users/availability', { status });
export const getMemberDetail = (userId) => api.get(`/analytics/member/${userId}`);
export const resetAvatar = () => api.patch('/users/reset-avatar');

