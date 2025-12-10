import { Router, Request, Response, NextFunction } from 'express';

import { fetchLines, fetchArrivals } from '../services/mobilityClient.js';
import { fetchAQI } from '../services/airQualityClient.js';

export const tripPlanRouter = Router();

const defaultStop = process.env.DEFAULT_STOP_ID ?? 'STOP-A';

tripPlanRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
  const { zoneCode = 'CENTRE', preferredMode, stopId = defaultStop } = req.body ?? {};
  try {
    const aqi = await fetchAQI(zoneCode);
    const chosenMode = pickMode(aqi.value, preferredMode);
    const [lines, arrivals] = await Promise.all([
      fetchLines(chosenMode),
      fetchArrivals(stopId),
    ]);

    res.json({
      timestamp: new Date().toISOString(),
      recommendation: {
        mode: chosenMode,
        reason: aqi.recommendation,
        caution: aqi.category,
      },
      metrics: {
        aqi,
      },
      transport: {
        lines,
        arrivals,
        stopId,
      },
    });
  } catch (error) {
    next(error);
  }
});

function pickMode(aqiValue: number, preferredMode?: string): string {
  if (aqiValue >= 120) {
    return 'metro';
  }
  if (aqiValue >= 90 && preferredMode === 'bike') {
    return 'bus';
  }
  return preferredMode ?? (aqiValue > 70 ? 'tram' : 'bike');
}
