import express from 'express';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { router } from './routes';

export const app = express();

app.use(express.json({ limit: '100kb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({ success: true, status: 'ok' });
});

app.use(router);

app.use(notFoundHandler);
app.use(errorHandler);
