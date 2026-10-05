import api from './client';

export const createBooking = (payload) => api.post('/bookings', payload);
export const getUserBookings = () => api.get('/bookings/user');
export const getOwnerConnectRequests = () => api.get('/bookings/owner');
