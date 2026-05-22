import crypto from 'crypto';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import { createRazorpayOrder } from '../../lib/razorpay.js';
import { sendPushNotification } from '../../lib/fcm.js';
import type {
  InitiateBookingInput,
  UpdateBookingStatusInput,
  GetMyBookingsInput,
} from './bookingValidation.js';

const COMMITMENT_FEE_PAISE = 2000; // ₹20 commitment fee

function generateCheckinOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ── Initiate Booking ────────────────────────────────

export async function initiateBooking(customerId: string, input: InitiateBookingInput) {
  const { slotId, barberId, serviceId } = input;

  return prisma.$transaction(async (tx) => {
    // SELECT FOR UPDATE to lock the slot row
    const slots = await tx.$queryRawUnsafe<Array<{
      id: string;
      barberId: string;
      salonId: string;
      status: string;
      startTime: Date;
    }>>(
      'SELECT id, "barberId", "salonId", status, "startTime" FROM "Slot" WHERE id = $1 FOR UPDATE',
      slotId
    );

    if (slots.length === 0) {
      throw new AppError('Slot not found', 404, 'NOT_FOUND');
    }

    const slot = slots[0];

    if (slot.barberId !== barberId) {
      throw new AppError('Slot does not belong to the specified barber', 400, 'INVALID_SLOT');
    }

    if (slot.status !== 'AVAILABLE') {
      throw new AppError('Slot is no longer available', 409, 'SLOT_UNAVAILABLE');
    }

    // Verify service exists and is active
    const service = await tx.service.findFirst({
      where: { id: serviceId, salonId: slot.salonId, isActive: true },
    });

    if (!service) {
      throw new AppError('Service not found or inactive', 404, 'SERVICE_NOT_FOUND');
    }

    const checkinOtp = generateCheckinOtp();

    // Create Razorpay order for commitment fee
    const rzpOrder = await createRazorpayOrder(
      COMMITMENT_FEE_PAISE,
      `booking_${Date.now()}`,
      {
        slotId,
        customerId,
        barberId,
        serviceId,
      }
    );

    // Create booking
    const booking = await tx.booking.create({
      data: {
        customerId,
        barberId,
        slotId,
        serviceId,
        status: 'PENDING_PAYMENT',
        checkinOtp,
        razorpayOrderId: rzpOrder.id,
      },
      include: {
        service: true,
        slot: true,
        barber: {
          include: {
            user: { select: { name: true } },
          },
        },
      },
    });

    // Mark slot as CONFIRMED (optimistically; will revert if payment fails)
    await tx.slot.update({
      where: { id: slotId },
      data: { status: 'CONFIRMED' },
    });

    logger.info(
      { bookingId: booking.id, slotId, customerId },
      'Booking initiated'
    );

    return {
      bookingId: booking.id,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      checkinOtp,
    };
  });
}

// ── Confirm Booking (called after payment) ──────────

export async function confirmBooking(bookingId: string, razorpayPaymentId: string) {
  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: 'CONFIRMED',
      commitmentFeePaid: true,
      razorpayPaymentId,
    },
    include: {
      customer: { select: { id: true, name: true, email: true, fcmToken: true } },
      barber: {
        include: {
          user: { select: { name: true, fcmToken: true } },
        },
      },
      service: true,
      slot: true,
    },
  });

  // Send push notification to barber
  if (booking.barber.user.fcmToken) {
    await sendPushNotification(
      booking.barber.user.fcmToken,
      'New Booking! 📋',
      `${booking.customer.name} booked ${booking.service.name} at ${booking.slot.startTime.toLocaleTimeString()}`
    );
  }

  logger.info({ bookingId, razorpayPaymentId }, 'Booking confirmed');
  return booking;
}

// ── Update Booking Status ───────────────────────────

export async function updateBookingStatus(
  bookingId: string,
  userId: string,
  input: UpdateBookingStatusInput
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: true,
      barber: { include: { salon: true } },
      customer: { select: { id: true, fcmToken: true, name: true } },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  // Only salon owner, assigned barber, or admin can update status
  const isOwner = booking.barber.salon.ownerId === userId;
  const isBarber = booking.barber.userId === userId;
  if (!isOwner && !isBarber) {
    throw new AppError('Not authorized to update this booking', 403, 'FORBIDDEN');
  }

  // Status transition validation
  const validTransitions: Record<string, string[]> = {
    CONFIRMED: ['ARRIVED', 'CANCELLED', 'NO_SHOW'],
    ARRIVED: ['IN_SERVICE', 'CANCELLED', 'NO_SHOW'],
    IN_SERVICE: ['COMPLETED'],
  };

  const allowed = validTransitions[booking.status] || [];
  if (!allowed.includes(input.status)) {
    throw new AppError(
      `Cannot transition from ${booking.status} to ${input.status}`,
      400,
      'INVALID_TRANSITION'
    );
  }

  // Update booking status
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: input.status as never },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: true,
      slot: true,
    },
  });

  // Update slot status accordingly
  const slotStatusMap: Record<string, string> = {
    ARRIVED: 'CONFIRMED',
    IN_SERVICE: 'IN_SERVICE',
    COMPLETED: 'COMPLETED',
    CANCELLED: 'AVAILABLE',
    NO_SHOW: 'AVAILABLE',
  };

  const newSlotStatus = slotStatusMap[input.status];
  if (newSlotStatus) {
    await prisma.slot.update({
      where: { id: booking.slotId },
      data: { status: newSlotStatus as never },
    });
  }

  // Update barber totalServed on completion
  if (input.status === 'COMPLETED') {
    await prisma.barber.update({
      where: { id: booking.barberId },
      data: { totalServed: { increment: 1 } },
    });
  }

  // Send push notification to customer
  if (booking.customer.fcmToken) {
    const messages: Record<string, string> = {
      IN_SERVICE: "You're now being served! 💈",
      COMPLETED: 'Your haircut is done! Please rate your experience. ⭐',
      CANCELLED: 'Your booking has been cancelled.',
      NO_SHOW: 'You were marked as no-show for your booking.',
    };
    const msg = messages[input.status];
    if (msg) {
      await sendPushNotification(booking.customer.fcmToken, 'SnipQ Update', msg);
    }
  }

  logger.info({ bookingId, newStatus: input.status }, 'Booking status updated');
  return updated;
}

// ── Arrive (Check-in with OTP) ──────────────────────

export async function arriveBooking(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      barber: { include: { salon: true } },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  // Only salon owner or assigned barber can mark arrival
  const isOwner = booking.barber.salon.ownerId === userId;
  const isBarber = booking.barber.userId === userId;
  if (!isOwner && !isBarber) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'CONFIRMED') {
    throw new AppError('Booking must be CONFIRMED to check in', 400, 'INVALID_STATUS');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'ARRIVED' },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: true,
      slot: true,
    },
  });

  logger.info({ bookingId }, 'Customer arrived');
  return updated;
}

// ── Mark Payment Received ───────────────────────────

export async function markPaymentReceived(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      barber: { include: { salon: true } },
    },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  const isOwner = booking.barber.salon.ownerId === userId;
  const isBarber = booking.barber.userId === userId;
  if (!isOwner && !isBarber) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { servicePaymentReceived: true },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      service: true,
      slot: true,
    },
  });

  logger.info({ bookingId }, 'Service payment received');
  return updated;
}

// ── Get My Bookings ─────────────────────────────────

export async function getMyBookings(customerId: string, input: GetMyBookingsInput) {
  const { page, limit, status } = input;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { customerId };
  if (status) {
    where.status = status;
  }

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        barber: {
          include: {
            user: { select: { name: true } },
            salon: { select: { id: true, name: true, address: true } },
          },
        },
        service: true,
        slot: true,
        rating: true,
      },
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
