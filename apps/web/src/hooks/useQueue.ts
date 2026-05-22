import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueueStore } from '../store/queueStore';
import { useAuthStore } from '../store/authStore';
import { queueService } from '../services/queue';

export function useQueue(barberId: string | null) {
  const { queue, myPosition, barberStatus, setQueueData, setBarberStatus } = useQueueStore();
  const { accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!barberId) return;

    // 1. Initial fetch via REST
    queueService.getBarberQueue(barberId)
      .then(res => {
        setQueueData(res.data.queue, res.data.myPosition);
        setBarberStatus('online');
      })
      .catch(err => {
        console.error('Failed to fetch initial queue', err);
        setBarberStatus('offline');
      });

    // 2. Setup Socket.io connection
    const socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000', {
      auth: { token: accessToken },
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setBarberStatus('online');
      socket.emit('join_barber_queue', { barberId });
    });

    socket.on('disconnect', () => {
      setBarberStatus('offline');
    });

    socket.on('queue_updated', (data) => {
      setQueueData(data.queue, data.myPosition);
    });

    // 3. Fallback polling (every 15s) in case websocket fails
    const pollInterval = setInterval(() => {
      if (socket.disconnected) {
        queueService.getBarberQueue(barberId)
          .then(res => setQueueData(res.data.queue, res.data.myPosition))
          .catch(() => {}); // silent fail on poll
      }
    }, 15000);

    return () => {
      clearInterval(pollInterval);
      socket.emit('leave_barber_queue', { barberId });
      socket.disconnect();
    };
  }, [barberId, accessToken, setQueueData, setBarberStatus]);

  return { queue, myPosition, barberStatus };
}
