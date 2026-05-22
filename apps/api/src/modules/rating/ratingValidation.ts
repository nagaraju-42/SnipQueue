import { z } from 'zod';

export const submitRatingSchema = z.object({
  bookingId: z.string().min(1),
  stars: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export const getBarberRatingsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;
export type GetBarberRatingsInput = z.infer<typeof getBarberRatingsSchema>;
