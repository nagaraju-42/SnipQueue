import api from './api';
import { RegisterRequest, LoginRequest, AuthTokens, User, ApiSuccess } from '@/types';

export const authService = {
  register: async (data: RegisterRequest) => {
    const res = await api.post<ApiSuccess<{ user: User }>>('/auth/register', data);
    return res.data;
  },
  verifyOtp: async (email: string, otp: string) => {
    const res = await api.post<ApiSuccess<{ verified: boolean }>>('/auth/verify-otp', { email, otp });
    return res.data;
  },
  login: async (data: LoginRequest) => {
    const res = await api.post<ApiSuccess<{ user: User } & AuthTokens>>('/auth/login', data);
    return res.data;
  },
  forgotPassword: async (email: string) => {
    const res = await api.post<ApiSuccess>('/auth/forgot-password', { email });
    return res.data;
  },
  resetPassword: async (email: string, otp: string, newPassword: string) => {
    const res = await api.post<ApiSuccess>('/auth/reset-password', { email, otp, newPassword });
    return res.data;
  },
};
