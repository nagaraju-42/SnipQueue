import { z } from 'zod';

export const generateSlotsSchema = z.object({
  barberId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  // Optionally override salon defaults
  openTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  slotDurationMin: z.coerce.number().int().min(10).max(120).optional(),
});

export const blockSlotSchema = z.object({
  reason: z.string().max(500).optional(),
});

export const walkInSchema = z.object({
  customerName: z.string().min(1).max(200),
  customerPhone: z.string().min(10).max(15).optional(),
  serviceId: z.string().optional(),
  paymentReceived: z.boolean().default(false),
  paymentMethod: z.string().optional(),
});

export const getBarberSlotsSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  status: z.enum(['AVAILABLE', 'CONFIRMED', 'WALK_IN', 'BLOCKED', 'IN_SERVICE', 'COMPLETED']).optional(),
});

export type GenerateSlotsInput = z.infer<typeof generateSlotsSchema>;
export type BlockSlotInput = z.infer<typeof blockSlotSchema>;
export type WalkInInput = z.infer<typeof walkInSchema>;
export type GetBarberSlotsInput = z.infer<typeof getBarberSlotsSchema>;
