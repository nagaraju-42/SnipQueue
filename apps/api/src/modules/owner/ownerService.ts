import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths } from 'date-fns';

// ── Get Dashboard Summary for Today ─────────────────

export async function getDashboardToday(ownerId: string) {
  // Get all salons owned by this user
  const salons = await prisma.salon.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });

  if (salons.length === 0) {
    throw new AppError('No salons found', 404, 'NO_SALONS');
  }

  const salonIds = salons.map((s) => s.id);
  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const [totalBookingsToday, totalWalkInsToday, activeBarbers, totalBarbers, currentlyServing, todayServices] = await Promise.all([
    // Total bookings today across all salons
    prisma.booking.count({
      where: {
        barber: { salonId: { in: salonIds } },
        slot: { date: { gte: dayStart, lte: dayEnd } },
        status: { not: 'CANCELLED' },
      },
    }),
    // Total walk-ins today
    prisma.walkIn.count({
      where: {
        salonId: { in: salonIds },
        createdAt: { gte: dayStart, lte: dayEnd },
      },
    }),
    // Active barbers
    prisma.barber.count({
      where: { salonId: { in: salonIds }, isActive: true },
    }),
    // Total barbers
    prisma.barber.count({
      where: { salonId: { in: salonIds } },
    }),
    // Currently serving
    prisma.slot.count({
      where: {
        salonId: { in: salonIds },
        status: 'IN_SERVICE',
        date: { gte: dayStart, lte: dayEnd },
      },
    }),
    // Get today's completed bookings for revenue estimate
    prisma.booking.findMany({
      where: {
        barber: { salonId: { in: salonIds } },
        slot: { date: { gte: dayStart, lte: dayEnd } },
        status: { in: ['COMPLETED', 'IN_SERVICE', 'CONFIRMED', 'ARRIVED'] },
      },
      include: { service: { select: { price: true } } },
    }),
  ]);

  const estimatedRevenueToday = todayServices.reduce(
    (sum, booking) => sum + booking.service.price,
    0
  );

  return {
    totalBookingsToday,
    totalWalkInsToday,
    estimatedRevenueToday,
    activeBarbers,
    totalBarbers,
    currentlyServing,
  };
}

// ── Compute Salary ──────────────────────────────────

export async function computeSalary(
  ownerId: string,
  options?: { month?: number; year?: number; ratePerSlot?: number }
) {
  const salons = await prisma.salon.findMany({
    where: { ownerId },
    select: { id: true },
  });

  if (salons.length === 0) {
    throw new AppError('No salons found', 404, 'NO_SALONS');
  }

  const salonIds = salons.map((s) => s.id);
  const now = new Date();
  const targetDate = options?.month && options?.year
    ? new Date(options.year, options.month - 1, 1)
    : subMonths(now, 1); // Default to last month

  const periodStart = startOfMonth(targetDate);
  const periodEnd = endOfMonth(targetDate);
  const ratePerSlot = options?.ratePerSlot || 200; // Default ₹200 per slot

  const barbers = await prisma.barber.findMany({
    where: { salonId: { in: salonIds } },
    include: {
      user: { select: { name: true } },
    },
  });

  const salaryData = await Promise.all(
    barbers.map(async (barber) => {
      // Count confirmed/completed slots
      const confirmedSlots = await prisma.slot.count({
        where: {
          barberId: barber.id,
          status: 'COMPLETED',
          date: { gte: periodStart, lte: periodEnd },
          booking: { isNot: null },
        },
      });

      const walkInSlots = await prisma.slot.count({
        where: {
          barberId: barber.id,
          status: 'COMPLETED',
          date: { gte: periodStart, lte: periodEnd },
          walkIn: { isNot: null },
        },
      });

      const totalSlots = confirmedSlots + walkInSlots;
      const totalSalary = totalSlots * ratePerSlot;

      // Check if salary already paid for this period
      const existingRecord = await prisma.salaryRecord.findFirst({
        where: {
          barberId: barber.id,
          periodStart,
          periodEnd,
        },
      });

      return {
        barberId: barber.id,
        barberName: barber.user.name,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        confirmedSlots,
        walkInSlots,
        totalSlots,
        ratePerSlot,
        totalSalary,
        avgRating: barber.avgRating,
        isPaid: !!existingRecord?.paidAt,
      };
    })
  );

  return salaryData;
}

// ── Mark Salary Paid ────────────────────────────────

export async function markSalaryPaid(
  ownerId: string,
  data: {
    barberId: string;
    periodStart: string;
    periodEnd: string;
    slotsCompleted: number;
    salaryAmount: number;
  }
) {
  // Verify barber belongs to owner's salon
  const barber = await prisma.barber.findUnique({
    where: { id: data.barberId },
    include: { salon: true },
  });

  if (!barber || barber.salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const record = await prisma.salaryRecord.create({
    data: {
      barberId: data.barberId,
      periodStart: new Date(data.periodStart),
      periodEnd: new Date(data.periodEnd),
      slotsCompleted: data.slotsCompleted,
      salaryAmount: data.salaryAmount,
      paidAt: new Date(),
      paidBy: ownerId,
    },
    include: {
      barber: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  logger.info({ recordId: record.id, barberId: data.barberId }, 'Salary marked as paid');
  return record;
}

// ── Get Revenue ─────────────────────────────────────

export async function getRevenue(
  ownerId: string,
  options?: { startDate?: string; endDate?: string }
) {
  const salons = await prisma.salon.findMany({
    where: { ownerId },
    select: { id: true, name: true },
  });

  if (salons.length === 0) {
    throw new AppError('No salons found', 404, 'NO_SALONS');
  }

  const salonIds = salons.map((s) => s.id);
  const now = new Date();
  const startDate = options?.startDate
    ? new Date(options.startDate)
    : startOfMonth(now);
  const endDate = options?.endDate
    ? new Date(options.endDate)
    : endOfDay(now);

  // Get all completed bookings in the period
  const completedBookings = await prisma.booking.findMany({
    where: {
      barber: { salonId: { in: salonIds } },
      status: 'COMPLETED',
      slot: { date: { gte: startDate, lte: endDate } },
    },
    include: {
      service: { select: { price: true, name: true } },
      barber: {
        include: {
          user: { select: { name: true } },
          salon: { select: { name: true } },
        },
      },
    },
  });

  // Get walk-ins in the period
  const completedWalkIns = await prisma.walkIn.findMany({
    where: {
      salonId: { in: salonIds },
      createdAt: { gte: startDate, lte: endDate },
      paymentReceived: true,
    },
    include: {
      service: { select: { price: true, name: true } },
    },
  });

  const bookingRevenue = completedBookings.reduce(
    (sum, b) => sum + b.service.price,
    0
  );

  const walkInRevenue = completedWalkIns.reduce(
    (sum, w) => sum + (w.service?.price || 0),
    0
  );

  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    bookingRevenue,
    walkInRevenue,
    totalRevenue: bookingRevenue + walkInRevenue,
    totalBookings: completedBookings.length,
    totalWalkIns: completedWalkIns.length,
  };
}
