import api from './api';
import { QueueUpdate, ApiSuccess } from '@/types';

export const queueService = {
  getBarberQueue: async (barberId: string) => {
    const res = await api.get<ApiSuccess<QueueUpdate>>(`/queue/${barberId}`);
    return res.data;
  },
};
