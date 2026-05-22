import { create } from 'zustand';
import { QueueItem } from '@/types';

interface QueueState {
  queue: QueueItem[];
  myPosition: number | null;
  barberStatus: 'online' | 'offline';
  setQueueData: (queue: QueueItem[], myPosition?: number | null) => void;
  setBarberStatus: (status: 'online' | 'offline') => void;
}

export const useQueueStore = create<QueueState>((set) => ({
  queue: [],
  myPosition: null,
  barberStatus: 'offline',
  setQueueData: (queue, myPosition = null) => set({ queue, myPosition }),
  setBarberStatus: (status) => set({ barberStatus: status }),
}));
