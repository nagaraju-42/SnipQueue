import { z } from 'zod';

export const addBarberSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(15).optional(),
  password: z.string().min(8).max(128),
  profilePhotoUrl: z.string().url().optional(),
});

export const updateBarberSchema = z.object({
  profilePhotoUrl: z.string().url().nullable().optional(),
  isActive: z.boolean().optional(),
});

export type AddBarberInput = z.infer<typeof addBarberSchema>;
export type UpdateBarberInput = z.infer<typeof updateBarberSchema>;
