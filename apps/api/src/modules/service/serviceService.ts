import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../middlewares/errorHandler.js';
import { logger } from '../../config/logger.js';
import type { CreateServiceInput, UpdateServiceInput } from './serviceValidation.js';

// ── Create Service ──────────────────────────────────

export async function createService(salonId: string, ownerId: string, input: CreateServiceInput) {
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }
  if (salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const service = await prisma.service.create({
    data: {
      ...input,
      salonId,
    },
  });

  logger.info({ serviceId: service.id, salonId }, 'Service created');
  return service;
}

// ── Update Service ──────────────────────────────────

export async function updateService(serviceId: string, ownerId: string, input: UpdateServiceInput) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { salon: true },
  });

  if (!service) {
    throw new AppError('Service not found', 404, 'NOT_FOUND');
  }
  if (service.salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  const updated = await prisma.service.update({
    where: { id: serviceId },
    data: input,
  });

  logger.info({ serviceId }, 'Service updated');
  return updated;
}

// ── Delete Service (soft-delete) ────────────────────

export async function deleteService(serviceId: string, ownerId: string) {
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: { salon: true },
  });

  if (!service) {
    throw new AppError('Service not found', 404, 'NOT_FOUND');
  }
  if (service.salon.ownerId !== ownerId) {
    throw new AppError('Not authorized', 403, 'FORBIDDEN');
  }

  // Soft delete by deactivating
  await prisma.service.update({
    where: { id: serviceId },
    data: { isActive: false },
  });

  logger.info({ serviceId }, 'Service deactivated');
  return { message: 'Service deleted successfully' };
}

// ── List Services by Salon ──────────────────────────

export async function listServicesBySalon(salonId: string) {
  const salon = await prisma.salon.findUnique({ where: { id: salonId } });
  if (!salon) {
    throw new AppError('Salon not found', 404, 'NOT_FOUND');
  }

  const services = await prisma.service.findMany({
    where: { salonId, isActive: true },
    orderBy: { name: 'asc' },
  });

  return services;
}
