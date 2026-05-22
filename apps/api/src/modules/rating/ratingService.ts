import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { SubmitRatingInput, GetBarberRatingsInput } from './ratingValidation.js';

// ── Submit Rating ───────────────────────────────────

export async function submitRating(customerId: string, input: SubmitRatingInput) {
  const { bookingId, stars, comment } = input;

  // Verify booking exists, belongs to customer, and is COMPLETED
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { rating: true },
  });

  if (!booking) {
    throw new AppError('Booking not found', 404, 'NOT_FOUND');
  }

  if (booking.customerId !== customerId) {
    throw new AppError('Not authorized to rate this booking', 403, 'FORBIDDEN');
  }

  if (booking.status !== 'COMPLETED') {
    throw new AppError('Can only rate completed bookings', 400, 'BOOKING_NOT_COMPLETED');
  }

  if (booking.rating) {
    throw new AppError('Rating already submitted for this booking', 409, 'ALREADY_RATED');
  }

  // Create rating and update barber average in a transaction
  const rating = await prisma.$transaction(async (tx) => {
    const newRating = await tx.rating.create({
      data: {
        bookingId,
        customerId,
        barberId: booking.barberId,
        stars,
        comment,
      },
      include: {
        customer: {
          select: { id: true, name: true },
        },
      },
    });

    // Calculate new average rating
    const aggregation = await tx.rating.aggregate({
      where: { barberId: booking.barberId },
      _avg: { stars: true },
    });

    const newAvgRating = aggregation._avg.stars || 0;

    // Update barber's average rating
    await tx.barber.update({
      where: { id: booking.barberId },
      data: { avgRating: Math.round(newAvgRating * 10) / 10 },
    });

    // Also update salon average rating
    const salonBarbers = await tx.barber.findMany({
      where: { salonId: (await tx.barber.findUnique({ where: { id: booking.barberId } }))!.salonId },
      select: { avgRating: true },
    });

    const salonAvg =
      salonBarbers.reduce((sum, b) => sum + b.avgRating, 0) / salonBarbers.length;

    const barber = await tx.barber.findUnique({ where: { id: booking.barberId } });
    if (barber) {
      await tx.salon.update({
        where: { id: barber.salonId },
        data: { avgRating: Math.round(salonAvg * 10) / 10 },
      });
    }

    return newRating;
  });

  logger.info({ ratingId: rating.id, bookingId, stars }, 'Rating submitted');
  return rating;
}

// ── Get Barber Ratings ──────────────────────────────

export async function getBarberRatings(barberId: string, input: GetBarberRatingsInput) {
  const { page, limit } = input;
  const skip = (page - 1) * limit;

  const [ratings, total] = await Promise.all([
    prisma.rating.findMany({
      where: { barberId },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: {
          select: { id: true, name: true },
        },
        booking: {
          include: {
            service: { select: { name: true } },
          },
        },
      },
    }),
    prisma.rating.count({ where: { barberId } }),
  ]);

  return {
    ratings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
