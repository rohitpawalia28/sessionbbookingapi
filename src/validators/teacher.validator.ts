import { z } from 'zod';

export const createTeacherSchema = z
  .object({
    fullName: z.string({ required_error: 'is required' }).trim().min(2).max(100),
    email: z.string({ required_error: 'is required' }).trim().toLowerCase().email('must be a valid email'),
    specialization: z.string({ required_error: 'is required' }).trim().min(2).max(100),
    experience: z
      .number({ required_error: 'is required', invalid_type_error: 'must be a number of years' })
      .int()
      .min(0)
      .max(80),
  })
  .strict();

export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
