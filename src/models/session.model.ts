import { InferSchemaType, Schema, model } from 'mongoose';

export const SESSION_STATUS = {
  AVAILABLE: 'AVAILABLE',
  BOOKED: 'BOOKED',
  COMPLETED: 'COMPLETED',
} as const;

export type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

const sessionSchema = new Schema(
  {
    teacherId: { type: Schema.Types.ObjectId, ref: 'Teacher', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(SESSION_STATUS),
      default: SESSION_STATUS.AVAILABLE,
      required: true,
    },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true, versionKey: false },
);

sessionSchema.path('endTime').validate(function (this: { startTime?: Date }, endTime: Date) {
  return !this.startTime || endTime.getTime() > this.startTime.getTime();
}, 'endTime must be greater than startTime');

sessionSchema.index({ status: 1, startTime: 1 });
sessionSchema.index({ userId: 1, status: 1, startTime: 1 });
sessionSchema.index({ teacherId: 1, startTime: 1 });

export type Session = InferSchemaType<typeof sessionSchema>;

export const SessionModel = model('Session', sessionSchema);
