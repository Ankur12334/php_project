import api from './client';

export const getAdminDashboard = () => api.get('/admin/dashboard');
export const getPendingRooms = () => api.get('/admin/rooms/pending');
export const approveRoom = (id) => api.put(`/admin/rooms/${id}/approve`);
export const rejectRoom = (id) => api.put(`/admin/rooms/${id}/reject`);
export const getUsers = () => api.get('/admin/users');
export const getReports = () => api.get('/admin/reports');
