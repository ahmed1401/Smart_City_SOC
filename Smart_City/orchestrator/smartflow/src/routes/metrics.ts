import { Router, Request, Response, NextFunction } from 'express';

import { fetchAQI, fetchPollutants } from '../services/airQualityClient.js';
import { fetchLines, fetchArrivals } from '../services/mobilityClient.js';
import { fetchRecentAlerts } from '../services/emergencyClient.js';

export const metricsRouter = Router();

metricsRouter.get('/overview', async (req: Request, res: Response, next: NextFunction) => {
  const zoneCode = (req.query.zoneCode as string) ?? 'CENTRE';
  const preferredMode = (req.query.preferredMode as string) ?? 'bike';
  const stopId = (req.query.stopId as string) ?? 'STOP-A';
  try {
    const [aqi, pollutants, lines, arrivals] = await Promise.all([
      fetchAQI(zoneCode),
      fetchPollutants(zoneCode),
      fetchLines(preferredMode),
      fetchArrivals(stopId),
    ]);

    let alerts: Awaited<ReturnType<typeof fetchRecentAlerts>> = [];
    let alertsError: string | undefined;
    try {
      alerts = await fetchRecentAlerts(5);
    } catch (alertError) {
      const message = alertError instanceof Error ? alertError.message : 'unknown error';
      console.warn('[metrics] Emergency alerts unavailable:', message);
      alertsError = 'Emergency service temporarily unavailable';
    }

    res.json({
      zoneCode,
      updatedAt: new Date().toISOString(),
      aqi,
      pollutants,
      transport: { lines, arrivals, stopId },
      alerts,
      alertsError,
    });
  } catch (error) {
    next(error);
  }
});
