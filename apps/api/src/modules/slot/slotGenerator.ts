import { addMinutes, parse, isBefore } from 'date-fns';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { GenerateSlotsInput } from './slotValidation.js';

/**
 * Generate time slots for a barber on a given date.
 * Uses salon's openTime/closeTime and slotDurationMin as defaults,
 * but allows per-call overrides.
 */
export async function generateSlots(salonId: string, input: GenerateSlotsInput) {
  const { barberId, date } = input;

  // Verify barber belongs to salon
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { salon: true },
  });

  if (!barber || barber.salonId !== salonId) {
    throw new AppError('Barber not found in this salon', 404, 'NOT_FOUND');
  }

  const salon = barber.salon;
  const openTime = input.openTime || salon.openTime;
  const closeTime = input.closeTime || salon.closeTime;
  const durationMin = input.slotDurationMin || salon.slotDurationMin;

  // Parse date and times
  const dateObj = new Date(date + 'T00:00:00');
  const dayStart = parse(openTime, 'HH:mm', dateObj);
  const dayEnd = parse(closeTime, 'HH:mm', dateObj);

  if (!isBefore(dayStart, dayEnd)) {
    throw new AppError('Open time must be before close time', 400, 'INVALID_TIME_RANGE');
  }

  // Check for existing slots on this date for this barber
  const existingSlots = await prisma.slot.count({
    where: {
      barberId,
      date: dateObj,
    },
  });

  if (existingSlots > 0) {
    throw new AppError(
      'Slots already exist for this barber on this date. Delete existing slots first.',
      409,
      'SLOTS_EXIST'
    );
  }

  // Generate slot data
  const slots: Array<{
    barberId: string;
    salonId: string;
    date: Date;
    startTime: Date;
    endTime: Date;
    status: 'AVAILABLE';
  }> = [];

  let current = dayStart;
  while (isBefore(current, dayEnd)) {
    const end = addMinutes(current, durationMin);
    if (isBefore(dayEnd, end)) break; // Don't create partial slots

    slots.push({
      barberId,
      salonId,
      date: dateObj,
      startTime: current,
      endTime: end,
      status: 'AVAILABLE',
    });

    current = end;
  }

  if (slots.length === 0) {
    throw new AppError('No slots could be generated for the given time range', 400, 'NO_SLOTS');
  }

  // Batch create slots
  const result = await prisma.slot.createMany({
    data: slots,
  });

  logger.info(
    { barberId, salonId, date, count: result.count },
    'Slots generated'
  );

  return {
    count: result.count,
    date,
    barberId,
  };
}
