import { app } from './app';
import { connectDatabase, disconnectDatabase } from './config/db';
import { env } from './config/env';
import { SessionModel } from './models/session.model';
import { TeacherModel } from './models/teacher.model';
import { UserModel } from './models/user.model';

async function bootstrap(): Promise<void> {
  await connectDatabase(env.mongoUri);

  await Promise.all([UserModel.init(), TeacherModel.init(), SessionModel.init()]);

  const server = app.listen(env.port, () => {
    console.log(`Server running on http://localhost:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal: string) => {
    console.log(`${signal} received, shutting down`);
    server.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
