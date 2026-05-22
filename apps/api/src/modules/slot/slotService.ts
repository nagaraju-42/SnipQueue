import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { WalkInInput, GetBarberSlotsInput } from './slotValidation.js';

// ── Block Slot ──────────────────────────────────────

export async function blockSlot(slotId: string, userId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { salon: true },
  });

  if (!slot) {
    throw new AppError('Slot not found', 404, 'NOT_FOUND');
  }

  // Only salon owner or barber can block
  if (slot.salon.ownerId !== userId) {
    const barber = await prisma.barber.findFirst({
      where: { userId, salonId: slot.salonId },
    });
    if (!barber) {
      throw new AppError('Not authorized', 403, 'FORBIDDEN');
    }
  }

  if (slot.status !== 'AVAILABLE') {
    throw new AppError(`Cannot block a slot with status ${slot.status}`, 400, 'INVALID_STATUS');
  }

  const updated = await prisma.slot.update({
    where: { id: slotId },
    data: { status: 'BLOCKED' },
  });

  logger.info({ slotId }, 'Slot blocked');
  return updated;
}

// ── Unblock Slot ────────────────────────────────────

export async function unblockSlot(slotId: string, userId: string) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { salon: true },
  });

  if (!slot) {
    throw new AppError('Slot not found', 404, 'NOT_FOUND');
  }

  if (slot.salon.ownerId !== userId) {
    const barber = await prisma.barber.findFirst({
      where: { userId, salonId: slot.salonId },
    });
    if (!barber) {
      throw new AppError('Not authorized', 403, 'FORBIDDEN');
    }
  }

  if (slot.status !== 'BLOCKED') {
    throw new AppError('Slot is not blocked', 400, 'INVALID_STATUS');
  }

  const updated = await prisma.slot.update({
    where: { id: slotId },
    data: { status: 'AVAILABLE' },
  });

  logger.info({ slotId }, 'Slot unblocked');
  return updated;
}

// ── Add Walk-In ─────────────────────────────────────

export async function addWalkIn(slotId: string, userId: string, input: WalkInInput) {
  return prisma.$transaction(async (tx) => {
    // Lock the slot row
    const slots = await tx.$queryRawUnsafe<Array<{
      id: string;
      barberId: string;
      salonId: string;
      status: string;
    }>>(
      'SELECT id, "barberId", "salonId", status FROM "Slot" WHERE id = $1 FOR UPDATE',
      slotId
    );

    if (slots.length === 0) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    const slot = slots[0];

    // Verify authorization
    const salon = await tx.salon.findUnique({ where: { id: slot.salonId } });
    if (!salon) {
      throw new AppError('Salon not found', 404, 'NOT_FOUND');
    }

    if (salon.ownerId !== userId) {
      const barber = await tx.barber.findFirst({
        where: { userId, salonId: slot.salonId },
      });
      if (!barber) {
        throw new AppError('Not authorized', 403, 'FORBIDDEN');
      }
    }

    if (slot.status !== 'AVAILABLE') {
      throw new AppError(`Cannot add walk-in to a slot with status ${slot.status}`, 400, 'SLOT_UNAVAILABLE');
    }

    // Create walk-in and update slot status atomically
    const walkIn = await tx.walkIn.create({
      data: {
        barberId: slot.barberId,
        salonId: slot.salonId,
        slotId: slot.id,
        serviceId: input.serviceId || null,
        customerName: input.customerName,
        customerPhone: input.customerPhone,
        paymentReceived: input.paymentReceived,
        paymentMethod: input.paymentMethod,
      },
      include: {
        service: true,
        slot: true,
      },
    });

    await tx.slot.update({
      where: { id: slotId },
      data: { status: 'WALK_IN' },
    });

    logger.info({ walkInId: walkIn.id, slotId }, 'Walk-in added');
    return walkIn;
  });
}

// ── Get Barber Slots ────────────────────────────────

export async function getBarberSlots(barberId: string, input: GetBarberSlotsInput) {
  const dateObj = new Date(input.date + 'T00:00:00');

  const where: Record<string, unknown> = {
    barberId,
    date: dateObj,
  };

  if (input.status) {
    where.status = input.status;
  }

  const slots = await prisma.slot.findMany({
    where,
    orderBy: { startTime: 'asc' },
    include: {
      booking: {
        include: {
          customer: {
            select: { id: true, name: true, phone: true },
          },
          service: true,
        },
      },
      walkIn: {
        include: {
          service: true,
        },
      },
    },
  });

  return slots;
}
