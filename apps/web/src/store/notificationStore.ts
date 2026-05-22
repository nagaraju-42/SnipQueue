import { create } from 'zustand';

interface NotificationState {
  unreadCount: number;
  recentAlerts: { id: string; message: string; date: string }[];
  fcmToken: string | null;
  addAlert: (message: string) => void;
  clearAlerts: () => void;
  setFcmToken: (token: string) => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  recentAlerts: [],
  fcmToken: null,
  addAlert: (message) => set((state) => ({ 
    recentAlerts: [{ id: Date.now().toString(), message, date: new Date().toISOString() }, ...state.recentAlerts],
    unreadCount: state.unreadCount + 1 
  })),
  clearAlerts: () => set({ recentAlerts: [], unreadCount: 0 }),
  setFcmToken: (fcmToken) => set({ fcmToken }),
}));
