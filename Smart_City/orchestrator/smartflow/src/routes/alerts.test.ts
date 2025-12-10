import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createApp } from '../app.js';
import * as EmergencyClient from '../services/emergencyClient.js';
import type { Alert } from '../services/emergencyClient.js';

describe('GET /alerts/recent', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns cached alerts list', async () => {
    vi.spyOn(EmergencyClient, 'fetchRecentAlerts').mockResolvedValue([
      { id: 'a1', type: 'TEST', zone: 'CENTRE', severity: 'SEVERITY_INFO', timestamp: 0 },
    ] as Alert[]);

    const response = await request(createApp()).get('/alerts/recent').expect(200);
    expect(response.body.alerts).toHaveLength(1);
    expect(response.body.filters).toBeNull();
  });

  it('forwards query filters to emergency client', async () => {
    const spy = vi.spyOn(EmergencyClient, 'fetchRecentAlerts').mockResolvedValue([]);

    await request(createApp())
      .get('/alerts/recent?limit=25&types=INCIDENT_TRANSPORT&zones=CENTRE&minimumSeverity=2')
      .expect(200);

    expect(spy).toHaveBeenCalledWith(25, {
      types: ['INCIDENT_TRANSPORT'],
      zones: ['CENTRE'],
      minimumSeverity: 2,
    });
  });
});

describe('POST /alerts', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('validates mandatory fields', async () => {
    await request(createApp()).post('/alerts').send({ zone: 'CENTRE' }).expect(400);
  });

  it('sends alert via emergency client', async () => {
    const spy = vi.spyOn(EmergencyClient, 'sendAlert').mockResolvedValue({ alertId: 'ack-1', accepted: true });

    const response = await request(createApp())
      .post('/alerts')
      .send({ type: 'INCIDENT_TRANSPORT', zone: 'centre', severity: 'SEVERITY_WARNING', description: 'Test alert' })
      .expect(201);

    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'INCIDENT_TRANSPORT', zone: 'CENTRE', severity: 'SEVERITY_WARNING' }),
    );
    expect(response.body.alertId).toBe('ack-1');
  });
});
