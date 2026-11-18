import { z } from 'zod';
import { AppError } from './AppError';

export function validate<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((issue) => ({
      field: issue.path.join('.') || '(root)',
      message: issue.message,
    }));
    throw AppError.badRequest('Validation failed', details);
  }
  return result.data;
}
