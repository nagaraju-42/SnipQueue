import { prisma } from '../../lib/prisma.js';
import { startOfDay, endOfDay } from 'date-fns';

export interface QueueEntry {
  position: number;
  bookingId: string | null;
  walkInId: string | null;
  customerName: string;
  serviceName: string;
  slotStartTime: string;
  status: string;
  isWalkIn: boolean;
}

/**
 * Get the barber's queue for today, ordered by slot start time.
 * Combines bookings and walk-ins into a unified queue.
 */
export async function getBarberQueue(barberId: string) {
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  // Get all non-available/non-blocked slots for today
  const slots = await prisma.slot.findMany({
    where: {
      barberId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        in: ['CONFIRMED', 'WALK_IN', 'IN_SERVICE', 'COMPLETED'],
      },
    },
    orderBy: { startTime: 'asc' },
    include: {
      booking: {
        include: {
          customer: { select: { name: true } },
          service: { select: { name: true, durationMin: true } },
        },
      },
      walkIn: {
        include: {
          service: { select: { name: true, durationMin: true } },
        },
      },
    },
  });

  const queue: QueueEntry[] = [];
  let position = 1;
  let currentlyServing: QueueEntry | null = null;
  let waitMinutes = 0;

  for (const slot of slots) {
    if (slot.status === 'COMPLETED') continue; // Skip completed

    const isWalkIn = !!slot.walkIn;
    const entry: QueueEntry = {
      position: position++,
      bookingId: slot.booking?.id || null,
      walkInId: slot.walkIn?.id || null,
      customerName: isWalkIn
        ? slot.walkIn!.customerName
        : slot.booking?.customer.name || 'Unknown',
      serviceName: isWalkIn
        ? slot.walkIn!.service?.name || 'Walk-in'
        : slot.booking?.service.name || 'Unknown',
      slotStartTime: slot.startTime.toISOString(),
      status: slot.status,
      isWalkIn,
    };

    if (slot.status === 'IN_SERVICE') {
      currentlyServing = entry;
    }

    queue.push(entry);

    // Estimate wait time based on service durations
    const duration = isWalkIn
      ? slot.walkIn!.service?.durationMin || 30
      : slot.booking?.service.durationMin || 30;
    waitMinutes += duration;
  }

  return {
    barberId,
    queue,
    totalInQueue: queue.length,
    currentlyServing,
    estimatedWaitMin: waitMinutes,
  };
}
