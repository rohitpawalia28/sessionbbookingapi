import { Request, Response } from 'express';
import * as teacherService from '../services/teacher.service';
import { validate } from '../utils/validate';
import { createTeacherSchema } from '../validators/teacher.validator';

export async function createTeacher(req: Request, res: Response): Promise<void> {
  const input = validate(createTeacherSchema, req.body);
  const teacher = await teacherService.createTeacher(input);
  res.status(201).json({ success: true, data: teacher });
}
