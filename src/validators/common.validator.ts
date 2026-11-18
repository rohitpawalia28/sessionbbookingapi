import { z } from 'zod';

export const objectIdSchema = z
  .string({ required_error: 'is required' })
  .regex(/^[a-f\d]{24}$/i, 'must be a valid 24-character ObjectId');

export const idParamSchema = z.object({ id: objectIdSchema });

export const dateInputSchema = z
  .union([z.string(), z.number()], {
    errorMap: () => ({ message: 'must be an ISO 8601 date string or epoch milliseconds' }),
  })
  .transform((value, ctx) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'must be an ISO 8601 date string or epoch milliseconds',
      });
      return z.NEVER;
    }
    return date;
  });
