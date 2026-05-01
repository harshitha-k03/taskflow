import api from './client';

export const getProjects = () => api.get('/projects');
export const getProject = (id) => api.get(`/projects/${id}`);
export const createProject = (data) => api.post('/projects', data);
export const updateProject = (id, data) => api.put(`/projects/${id}`, data);
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export const getMembers = (projectId) => api.get(`/projects/${projectId}/members`);
export const addMember = (projectId, data) => api.post(`/projects/${projectId}/members`, data);
export const removeMember = (projectId, userId) =>
  api.delete(`/projects/${projectId}/members/${userId}`);
export const updateMemberRole = (projectId, userId, role) =>
  api.put(`/projects/${projectId}/members/${userId}`, { role });

export const getProjectAnalytics = (projectId) =>
  api.get(`/projects/${projectId}/analytics`);
