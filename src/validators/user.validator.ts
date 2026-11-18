import { z } from 'zod';

export const createUserSchema = z
  .object({
    fullName: z.string({ required_error: 'is required' }).trim().min(2).max(100),
    email: z.string({ required_error: 'is required' }).trim().toLowerCase().email('must be a valid email'),
    phone: z
      .string({ required_error: 'is required' })
      .trim()
      .regex(/^\+?\d{7,15}$/, 'must be 7-15 digits, optionally starting with +'),
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
