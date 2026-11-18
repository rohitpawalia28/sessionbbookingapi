import { Types } from 'mongoose';
import { SESSION_STATUS, SessionModel } from '../models/session.model';
import { TeacherModel } from '../models/teacher.model';
import { UserModel } from '../models/user.model';
import { AppError } from '../utils/AppError';
import { CreateUserInput } from '../validators/user.validator';

export async function createUser(input: CreateUserInput) {
  const user = await UserModel.create(input);
  return user.toObject();
}

export async function getUserSessions(userId: string) {
  const userExists = await UserModel.exists({ _id: userId });
  if (!userExists) {
    throw AppError.notFound('User not found');
  }

  const [result] = await SessionModel.aggregate<{
    upcomingSessions: unknown[];
    completedSessions: unknown[];
  }>([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        status: { $in: [SESSION_STATUS.BOOKED, SESSION_STATUS.COMPLETED] },
      },
    },
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
        completedAt: 1,
        durationMinutes: { $dateDiff: { startDate: '$startTime', endDate: '$endTime', unit: 'minute' } },
        teacher: 1,
      },
    },
    {
      $facet: {
        upcomingSessions: [{ $match: { status: SESSION_STATUS.BOOKED } }, { $sort: { startTime: 1 } }],
        completedSessions: [{ $match: { status: SESSION_STATUS.COMPLETED } }, { $sort: { completedAt: -1 } }],
      },
    },
  ]);

  return {
    upcomingSessions: result.upcomingSessions,
    completedSessions: result.completedSessions,
    counts: {
      upcoming: result.upcomingSessions.length,
      completed: result.completedSessions.length,
    },
  };
}
