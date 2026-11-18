import { Router } from 'express';
import * as sessionController from '../controllers/session.controller';
import * as teacherController from '../controllers/teacher.controller';
import * as userController from '../controllers/user.controller';

const userRouter = Router();
userRouter.post('/', userController.createUser);
userRouter.get('/:id/sessions', userController.getUserSessions);

const teacherRouter = Router();
teacherRouter.post('/', teacherController.createTeacher);

const sessionRouter = Router();
sessionRouter.post('/', sessionController.createSession);
sessionRouter.get('/available', sessionController.getAvailableSessions);
sessionRouter.post('/:id/book', sessionController.bookSession);
sessionRouter.patch('/:id/complete', sessionController.completeSession);

export const router = Router();
router.use('/users', userRouter);
router.use('/teachers', teacherRouter);
router.use('/sessions', sessionRouter);
