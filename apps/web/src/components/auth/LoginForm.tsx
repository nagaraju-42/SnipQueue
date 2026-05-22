'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await login({ email, password });
      if (res.user.role === 'OWNER') {
        window.location.href = '/dashboard';
      } else if (res.user.role === 'BARBER') {
        window.location.href = '/queue-dashboard';
      } else {
        window.location.href = '/search';
      }
    } catch (err) {
      // error handled by hook
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <Input
        label="Email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Input
        label="Password"
        type="password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" className="w-full" isLoading={loading}>
        Sign In
      </Button>
    </form>
  );
}
