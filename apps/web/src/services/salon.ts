import api from './api';
import { Salon, ApiSuccess } from '@/types';

export const salonService = {
  searchSalons: async (query?: string, pincode?: string) => {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (pincode) params.append('pincode', pincode);
    
    const res = await api.get<ApiSuccess<Salon[]>>(`/salons/search?${params.toString()}`);
    return res.data;
  },
  getSalonById: async (id: string) => {
    const res = await api.get<ApiSuccess<Salon>>(`/salons/${id}`);
    return res.data;
  },
  createSalon: async (data: Partial<Salon>) => {
    const res = await api.post<ApiSuccess<Salon>>('/salons', data);
    return res.data;
  },
  updateSalon: async (id: string, data: Partial<Salon>) => {
    const res = await api.put<ApiSuccess<Salon>>(`/salons/${id}`, data);
    return res.data;
  }
};
