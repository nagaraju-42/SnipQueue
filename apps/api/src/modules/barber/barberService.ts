import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { AddBarberInput, UpdateBarberInput } from './barberValidation.js';

const SALT_ROUNDS = 12;

// ── Add Barber ──────────────────────────────────────

export async function addBarber(salonId: string, ownerId: string, input: AddBarberInput) {
  // Verify salon exists and belongs to owner
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }
  if (salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  // Check if email is already taken
  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    // If user exists but has no barber profile, link them
    const existingBarber = await prisma.barber.findUnique({ where: { userId: existingUser.id } });
    if (existingBarber) {
      throw new AppError('This user is already a barber', 409, 'ALREADY_BARBER');
    }

    // Create barber profile for existing user
    const barber = await prisma.barber.create({
      data: {
        salonId,
        userId: existingUser.id,
        profilePhotoUrl: input.profilePhotoUrl,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
      },
    });

    // Update user role to BARBER
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: 'BARBER' },
    });

    logger.info({ barberId: barber.id, salonId }, 'Existing user linked as barber');
    return barber;
  }

  // Create user + barber in a transaction
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const barber = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name: input.name,
        email: input.email,
        phone: input.phone,
        passwordHash,
        role: 'BARBER',
        isVerified: true, // Owner-created barbers are pre-verified
      },
    });

    const newBarber = await tx.barber.create({
      data: {
        salonId,
        userId: user.id,
        profilePhotoUrl: input.profilePhotoUrl,
      },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true, role: true },
        },
      },
    });

    return newBarber;
  });

  logger.info({ barberId: barber.id, salonId }, 'Barber created');
  return barber;
}

// ── Update Barber ───────────────────────────────────

export async function updateBarber(barberId: string, ownerId: string, input: UpdateBarberInput) {
  const barber = await prisma.barber.findUnique({
    where: { id: barberId },
    include: { salon: true },
  });

  if (!barber) {
    throw new AppError('Barber not found', 404, 'NOT_FOUND');
  }
  if (barber.salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const updated = await prisma.barber.update({
    where: { id: barberId },
    data: input,
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true, role: true },
      },
    },
  });

  logger.info({ barberId }, 'Barber updated');
  return updated;
}

// ── List Barbers by Salon ───────────────────────────

export async function listBarbersBySalon(salonId: string) {
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }

  const barbers = await prisma.barber.findMany({
    where: { salonId },
    include: {
      user: {
        select: { id: true, name: true, email: true, phone: true },
      },
    },
    orderBy: { avgRating: 'desc' },
  });

  return barbers;
}
