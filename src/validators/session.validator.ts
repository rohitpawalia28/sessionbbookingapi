import { z } from 'zod';
import { dateInputSchema, objectIdSchema } from './common.validator';

export const createSessionSchema = z
  .object({
    teacherId: objectIdSchema,
    startTime: dateInputSchema,
    endTime: dateInputSchema,
  })
  .strict()
  .refine((data) => data.endTime.getTime() > data.startTime.getTime(), {
    message: 'endTime must be greater than startTime',
    path: ['endTime'],
  });

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const bookSessionSchema = z.object({ userId: objectIdSchema }).strict();

export const availableSessionsQuerySchema = z.object({
  dateTimestamp: z
    .string({ required_error: 'query parameter is required' })
    .regex(/^\d{10}$|^\d{13}$/, 'must be a Unix timestamp in seconds (10 digits) or milliseconds (13 digits)')
    .transform((value) => new Date(value.length === 10 ? Number(value) * 1000 : Number(value))),
});
