import request from 'supertest';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createApp } from '../app.js';
import * as AirQualityClient from '../services/airQualityClient.js';
import * as MobilityClient from '../services/mobilityClient.js';

describe('POST /trip-plan', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates AQI and mobility data', async () => {
    vi.spyOn(AirQualityClient, 'fetchAQI').mockResolvedValue({
      zoneCode: 'CENTRE',
      value: 60,
      category: 'Moderate',
      recommendation: 'Enjoy your trip',
    });
    vi.spyOn(MobilityClient, 'fetchLines').mockResolvedValue([
      { id: 'L1', name: 'Ligne 1', mode: 'bike', status: 'active' },
    ]);
    vi.spyOn(MobilityClient, 'fetchArrivals').mockResolvedValue([
      { lineId: 'L1', etaMinutes: 5 },
    ]);

    const response = await request(createApp())
      .post('/trip-plan')
      .send({ zoneCode: 'CENTRE', preferredMode: 'bike' })
      .expect(200);

    expect(response.body.recommendation.mode).toBe('bike');
    expect(response.body.metrics.aqi.zoneCode).toBe('CENTRE');
    expect(response.body.transport.lines).toHaveLength(1);
  });

  it('returns gateway error when upstream fails', async () => {
    vi.spyOn(AirQualityClient, 'fetchAQI').mockRejectedValue(new Error('SOAP down'));

    const response = await request(createApp())
      .post('/trip-plan')
      .send({ zoneCode: 'UNKNOWN' })
      .expect(502);

    expect(response.body.error).toBe('orchestration_failed');
  });
});
