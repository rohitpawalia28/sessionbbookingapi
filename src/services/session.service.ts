import { env } from '../config/env';
import { SESSION_STATUS, SessionModel } from '../models/session.model';
import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { CreateSessionInput } from '../validators/session.validator';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export async function createSession(input: CreateSessionInput) {
  const teacherExists = await TeacherModel.exists({ _id: input.teacherId });
  if (!teacherExists) {
    throw AppError.notFound('Teacher not found');
  }

  const overlapping = await SessionModel.exists({
    teacherId: input.teacherId,
    startTime: { $lt: input.endTime },
    endTime: { $gt: input.startTime },
  });
  if (overlapping) {
    throw AppError.conflict('Teacher already has a session overlapping this time slot');
  }

  const session = await SessionModel.create({
    teacherId: input.teacherId,
    startTime: input.startTime,
    endTime: input.endTime,
  });
  return session.toObject();
}

export async function getAvailableSessions(date: Date) {
  const timezone = env.timezone;

  return SessionModel.aggregate([
    {
      $match: {
        status: SESSION_STATUS.AVAILABLE,
        startTime: {
          $gte: new Date(date.getTime() - ONE_DAY_MS),
          $lt: new Date(date.getTime() + ONE_DAY_MS),
        },
      },
    },
    {
      $match: {
        $expr: {
          $eq: [
            { $dateTrunc: { date: '$startTime', unit: 'day', timezone } },
            { $dateTrunc: { date, unit: 'day', timezone } },
          ],
        },
      },
    },
    { $sort: { startTime: 1 } },
    {
      $lookup: {
        from: TeacherModel.collection.name,
        localField: 'teacherId',
        foreignField: '_id',
        as: 'teacher',
        pipeline: [{ $project: { fullName: 1, email: 1, specialization: 1, experience: 1 } }],
      },
    },
    { $unwind: { path: '$teacher', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        startTime: 1,
        endTime: 1,
        status: 1,
        durationMinutes: { $dateDiff: { startDate: '$startTime', endDate: '$endTime', unit: 'minute' } },
        teacher: 1,
      },
    },
  ]);
}

export async function bookSession(sessionId: string, userId: string) {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw AppError.notFound('User not found');
  }

  const booked = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SESSION_STATUS.AVAILABLE },
    { $set: { status: SESSION_STATUS.BOOKED, userId } },
    { new: true },
  ).lean();

  if (booked) {
    return booked;
  }

  const existing = await SessionModel.findById(sessionId).select('status').lean();
  if (!existing) {
    throw AppError.notFound('Session not found');
  }
  if (existing.status === SESSION_STATUS.BOOKED) {
    throw AppError.conflict('Session is already booked');
  }
  throw AppError.conflict(`Only AVAILABLE sessions can be booked (current status: ${existing.status})`);
}

export async function completeSession(sessionId: string) {
  const completed = await SessionModel.findOneAndUpdate(
    { _id: sessionId, status: SESSION_STATUS.BOOKED },
    { $set: { status: SESSION_STATUS.COMPLETED, completedAt: new Date() } },
    { new: true },
  ).lean();

  if (completed) {
    return completed;
  }

  const existing = await SessionModel.findById(sessionId).select('status').lean();
  if (!existing) {
    throw AppError.notFound('Session not found');
  }
  throw AppError.conflict(
    `Only BOOKED sessions can be marked as completed (current status: ${existing.status})`,
  );
}
