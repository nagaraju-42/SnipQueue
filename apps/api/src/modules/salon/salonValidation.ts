import { z } from 'zod';

export const createSalonSchema = z.object({
  name: z.string().min(2).max(200),
  address: z.string().min(5).max(500),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  slotDurationMin: z.coerce.number().int().min(10).max(120).default(30),
  phonePeQrUrl: z.string().url().optional(),
});

export const updateSalonSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  address: z.string().min(5).max(500).optional(),
  pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits').optional(),
  openTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  closeTime: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format').optional(),
  slotDurationMin: z.coerce.number().int().min(10).max(120).optional(),
  phonePeQrUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export const searchSalonSchema = z.object({
  q: z.string().optional(),
  pincode: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type CreateSalonInput = z.infer<typeof createSalonSchema>;
export type UpdateSalonInput = z.infer<typeof updateSalonSchema>;
export type SearchSalonInput = z.infer<typeof searchSalonSchema>;
