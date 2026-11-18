import { Request, Response } from 'express';
import * as userService from '../services/user.service';
import { validate } from '../utils/validate';
import { idParamSchema } from '../validators/common.validator';
import { createUserSchema } from '../validators/user.validator';

export async function createUser(req: Request, res: Response): Promise<void> {
  const input = validate(createUserSchema, req.body);
  const user = await userService.createUser(input);
  res.status(201).json({ success: true, data: user });
}

export async function getUserSessions(req: Request, res: Response): Promise<void> {
  const { id } = validate(idParamSchema, req.params);
  const sessions = await userService.getUserSessions(id);
  res.status(200).json({ success: true, data: sessions });
}
