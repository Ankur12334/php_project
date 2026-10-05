import api from './client';

export const googleLogin = (payload) => api.post('/auth/google', payload);
export const sendOtp = (payload) => api.post('/auth/otp/send', payload);
export const verifyOtp = (payload) => api.post('/auth/otp/verify', payload);
export const completeRegistration = (payload) => api.post('/auth/register', payload);
