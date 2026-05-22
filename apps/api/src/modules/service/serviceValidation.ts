import { z } from 'zod';

export const createServiceSchema = z.object({
  name: z.string().min(2).max(200),
  price: z.coerce.number().int().min(0, 'Price must be non-negative'),
  durationMin: z.coerce.number().int().min(5).max(240),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).max(200).optional(),
  price: z.coerce.number().int().min(0).optional(),
  durationMin: z.coerce.number().int().min(5).max(240).optional(),
  isActive: z.boolean().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
