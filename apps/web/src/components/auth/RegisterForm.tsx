'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Role } from '@/types';
import { useRouter } from 'next/navigation';

export function RegisterForm() {
  const { register, loading, error } = useAuth();
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: Role.CUSTOMER
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      router.push(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      // handled
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <Input
        label="Full Name"
        required
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />
      <Input
        label="Email"
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
      />
      <Input
        label="Phone Number"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
      />
      <Input
        label="Password"
        type="password"
        required
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
      />
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">I am a:</label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`border rounded-lg p-3 flex items-center justify-center cursor-pointer transition-colors ${formData.role === Role.CUSTOMER ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border bg-white text-gray-600'}`}>
            <input type="radio" className="sr-only" checked={formData.role === Role.CUSTOMER} onChange={() => setFormData({...formData, role: Role.CUSTOMER})} />
            Customer
          </label>
          <label className={`border rounded-lg p-3 flex items-center justify-center cursor-pointer transition-colors ${formData.role === Role.OWNER ? 'border-primary bg-primary/5 text-primary font-medium' : 'border-border bg-white text-gray-600'}`}>
            <input type="radio" className="sr-only" checked={formData.role === Role.OWNER} onChange={() => setFormData({...formData, role: Role.OWNER})} />
            Salon Owner
          </label>
        </div>
      </div>

      {error && <p className="text-red-500 text-sm">{error}</p>}
      
      <Button type="submit" className="w-full mt-4" isLoading={loading}>
        Create Account
      </Button>
    </form>
  );
}
