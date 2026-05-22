import { z } from 'zod';

export const initiateBookingSchema = z.object({
  slotId: z.string().min(1),
  barberId: z.string().min(1),
  serviceId: z.string().min(1),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(['ARRIVED', 'IN_SERVICE', 'COMPLETED', 'CANCELLED', 'NO_SHOW']),
});

export const getMyBookingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  status: z.enum([
    'PENDING_PAYMENT', 'CONFIRMED', 'ARRIVED', 'IN_SERVICE',
    'COMPLETED', 'CANCELLED', 'NO_SHOW',
  ]).optional(),
});

export type InitiateBookingInput = z.infer<typeof initiateBookingSchema>;
export type UpdateBookingStatusInput = z.infer<typeof updateBookingStatusSchema>;
export type GetMyBookingsInput = z.infer<typeof getMyBookingsSchema>;
