import { TeacherModel } from '../models/teacher.model';
import { CreateTeacherInput } from '../validators/teacher.validator';

export async function createTeacher(input: CreateTeacherInput) {
  const teacher = await TeacherModel.create(input);
  return teacher.toObject();
}
