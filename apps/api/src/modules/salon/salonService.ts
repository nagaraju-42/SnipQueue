import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { CreateSalonInput, UpdateSalonInput, SearchSalonInput } from './salonValidation.js';

// ── Create Salon ────────────────────────────────────

export async function createSalon(ownerId: string, input: CreateSalonInput) {
  const salon = await prisma.salon.create({
    data: {
      ...input,
      ownerId,
    },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  logger.info({ salonId: salon.id, ownerId }, 'Salon created');
  return salon;
}

// ── Update Salon ────────────────────────────────────

export async function updateSalon(salonId: string, ownerId: string, input: UpdateSalonInput) {
  // Verify ownership
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }
  if (salon.ownerId !== ownerId) {
    throw new AppError('Not authorized to update this salon', 403, 'FORBIDDEN');
  }

  const updated = await prisma.salon.update({
    where: { id: salonId },
    data: input,
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  logger.info({ salonId }, 'Salon updated');
  return updated;
}

// ── Search Salons ───────────────────────────────────

export async function searchSalons(input: SearchSalonInput) {
  const { q, pincode, page, limit } = input;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isActive: true };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (pincode) {
    where.pincode = pincode;
  }

  const [salons, total] = await Promise.all([
    prisma.salon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { avgRating: 'desc' },
      include: {
        _count: { select: { barbers: true, services: true } },
      },
    }),
    prisma.salon.count({ where }),
  ]);

  return {
    salons,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// ── Get Salon By ID ─────────────────────────────────

export async function getSalonById(salonId: string) {
  const salon = await prisma.salon.findUnique({
    where: { id: salonId },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
      barbers: {
        where: { isActive: true },
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      services: {
        where: { isActive: true },
        orderBy: { name: 'asc' },
      },
    },
  });

  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }

  return salon;
}
