import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import * as AirQualityClient from '../services/airQualityClient.js';
import * as MobilityClient from '../services/mobilityClient.js';
import * as EmergencyClient from '../services/emergencyClient.js';
import type { Alert } from '../services/emergencyClient.js';

describe('GET /metrics/overview', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('aggregates AQI, transport and alerts data', async () => {
    vi.spyOn(AirQualityClient, 'fetchAQI').mockResolvedValue({
      zoneCode: 'CENTRE',
      value: 72,
      category: 'Moderate',
      recommendation: 'Limiter les efforts',
    });
    vi.spyOn(AirQualityClient, 'fetchPollutants').mockResolvedValue({
      zoneCode: 'CENTRE',
      pollutants: [
        { name: 'PM2.5', value: 35, unit: 'µg/m3' },
      ],
    });
    vi.spyOn(MobilityClient, 'fetchLines').mockResolvedValue([
      { id: 'L1', name: 'Ligne 1', mode: 'tram', status: 'active' },
    ]);
    vi.spyOn(MobilityClient, 'fetchArrivals').mockResolvedValue([
      { lineId: 'L1', etaMinutes: 4 },
    ]);
    vi.spyOn(EmergencyClient, 'fetchRecentAlerts').mockResolvedValue([
      { id: 'a1', type: 'TEST', zone: 'CENTRE', severity: 'SEVERITY_INFO', timestamp: 0 },
    ] as Alert[]);

    const response = await request(createApp())
      .get('/metrics/overview')
      .query({ zoneCode: 'CENTRE', preferredMode: 'tram', stopId: 'STOP-A' })
      .expect(200);

    expect(response.body.aqi.value).toBe(72);
    expect(response.body.transport.lines).toHaveLength(1);
    expect(response.body.alerts).toHaveLength(1);
  });
});
