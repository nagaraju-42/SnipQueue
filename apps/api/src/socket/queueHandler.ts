import { Server, Socket } from 'socket.io';
import { logger } from '../config/logger';

export function handleQueueEvents(io: Server, socket: Socket) {
  socket.on('join_barber_queue', ({ barberId }: { barberId: string }) => {
    const room = `queue:${barberId}`;
    socket.join(room);
    logger.info({ userId: socket.data.user.id, barberId }, 'Joined barber queue room');
  });

  socket.on('leave_barber_queue', ({ barberId }: { barberId: string }) => {
    const room = `queue:${barberId}`;
    socket.leave(room);
    logger.info({ userId: socket.data.user.id, barberId }, 'Left barber queue room');
  });
}

// Called by other services to broadcast updates
export function broadcastQueueUpdate(io: Server, barberId: string, queueData: any) {
  io.to(`queue:${barberId}`).emit('queue_updated', queueData);
}

// Notify specific user they are next
export function notifyUserNext(io: Server, customerId: string, bookingId: string, barberId: string) {
  // We can emit to a user-specific room if they joined one, or use FCM primarily.
  // For simplicity, we broadcast to the queue room, and the client can filter.
  // Ideally, users join a room like `user:${customerId}` upon connection.
  io.emit(`youre_next:${customerId}`, { bookingId, barberId }); 
}
