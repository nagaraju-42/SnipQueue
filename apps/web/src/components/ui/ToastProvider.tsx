'use client';

import { useNotificationStore } from '@/store/notificationStore';
import { useEffect, useState } from 'react';

export function ToastProvider() {
  const { recentAlerts, clearAlerts } = useNotificationStore();
  const [visibleAlerts, setVisibleAlerts] = useState<{id: string, message: string}[]>([]);

  useEffect(() => {
    if (recentAlerts.length > 0) {
      setVisibleAlerts(recentAlerts.slice(0, 3)); // show max 3
      const timer = setTimeout(() => {
        clearAlerts();
      }, 5000);
      return () => clearTimeout(timer);
    } else {
      setVisibleAlerts([]);
    }
  }, [recentAlerts, clearAlerts]);

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {visibleAlerts.map(alert => (
        <div 
          key={alert.id}
          className="bg-gray-800 text-white px-6 py-4 rounded-xl shadow-lg fade-in text-sm font-medium"
        >
          {alert.message}
        </div>
      ))}
    </div>
  );
}
