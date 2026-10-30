import { Router, Request, Response } from 'express';
import { getDbStatus } from '../config/db';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  const dbStatus = getDbStatus();

  res.status(200).json({
    status: 'ok',
    service: 'collabdocs-api',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
  });
});

export default router;

