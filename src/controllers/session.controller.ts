import { Request, Response } from 'express';
import * as sessionService from '../services/session.service';
import { validate } from '../utils/validate';
import { idParamSchema } from '../validators/common.validator';
import {
  availableSessionsQuerySchema,
  bookSessionSchema,
  createSessionSchema,
} from '../validators/session.validator';

export async function createSession(req: Request, res: Response): Promise<void> {
  const input = validate(createSessionSchema, req.body);
  const session = await sessionService.createSession(input);
  res.status(201).json({ success: true, data: session });
}

export async function getAvailableSessions(req: Request, res: Response): Promise<void> {
  const { dateTimestamp } = validate(availableSessionsQuerySchema, req.query);
  const sessions = await sessionService.getAvailableSessions(dateTimestamp);
  res.status(200).json({ success: true, count: sessions.length, data: sessions });
}

export async function bookSession(req: Request, res: Response): Promise<void> {
  const { id } = validate(idParamSchema, req.params);
  const { userId } = validate(bookSessionSchema, req.body);
  const session = await sessionService.bookSession(id, userId);
  res.status(200).json({ success: true, data: session });
}

export async function completeSession(req: Request, res: Response): Promise<void> {
  const { id } = validate(idParamSchema, req.params);
  const session = await sessionService.completeSession(id);
  res.status(200).json({ success: true, data: session });
}
