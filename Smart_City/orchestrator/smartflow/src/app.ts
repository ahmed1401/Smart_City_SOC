import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';

import { tripPlanRouter } from './routes/trip-plan.js';
import { metricsRouter } from './routes/metrics.js';
import { alertsRouter } from './routes/alerts.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(pinoHttp());

  app.use('/trip-plan', tripPlanRouter);
  app.use('/metrics', metricsRouter);
  app.use('/alerts', alertsRouter);
  app.get('/health', (_req, res) => res.json({ status: 'ok' }));


  app.use((err: Error & { status?: number }, req: Request, res: Response, _next: NextFunction) => {
    req.log?.error({ err }, 'SmartFlow orchestrator error');
    const status = err.status ?? 502;
    res.status(status).json({
      error: 'orchestration_failed',
      message: err.message,
    });
  });

  return app;
}
