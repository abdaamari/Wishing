import { z } from 'zod';

export const wishSchema = z.object({
  name: z.string().max(40).optional(),
  message: z.string().min(1).max(280),
  color: z.enum(['sky', 'butter', 'peach', 'mint', 'lavender']),
  is_anonymous: z.boolean().optional(),
});

export type WishInput = {
  name?: string;
  message: string;
  color: string;
  is_anonymous?: boolean;
};

