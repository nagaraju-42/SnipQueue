import { useState } from 'react';
import { authService } from '../services/auth';
import { useAuthStore } from '../store/authStore';
import { LoginRequest, RegisterRequest } from '@/types';
import { useRouter } from 'next/navigation';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authStore = useAuthStore();
  const router = useRouter();

  const login = async (data: LoginRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.login(data);
      authStore.login(res.data.user, res.data.accessToken, res.data.refreshToken);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.register(data);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authService.verifyOtp(email, otp);
      return res.data;
    } catch (err: any) {
      setError(err.response?.data?.error || 'OTP verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authStore.logout();
    router.push('/login');
  };

  return { login, register, verifyOtp, logout, loading, error };
};
