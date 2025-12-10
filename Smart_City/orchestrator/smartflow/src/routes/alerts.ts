import { Request, Response, Router } from 'express';

import { fetchRecentAlerts, subscribeAlertsStream, sendAlert } from '../services/emergencyClient.js';
import type { AlertFilterInput, SendAlertInput, Severity } from '../services/emergencyClient.js';

export const alertsRouter = Router();

const STREAM_SNAPSHOT_LIMIT = 10;
const STREAM_SNAPSHOT_INTERVAL_MS = Number(process.env.ALERT_STREAM_REFRESH_MS ?? 5000);

alertsRouter.get('/recent', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit);
    const filter = buildFilter(req.query);
    const alerts = await fetchRecentAlerts(limit, filter);
    res.json({ alerts, filters: filter ?? null });
  } catch (error) {
    next(error);
  }
});

alertsRouter.get('/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const filter = buildFilter(req.query);
  const stream = subscribeAlertsStream(filter);
  const heartbeat = setInterval(() => {
    res.write('event: ping\ndata: {}\n\n');
  }, 15000);

  let closed = false;
  let previousSnapshotHash = '';

  const pushSnapshot = async () => {
    try {
      const alerts = await fetchRecentAlerts(STREAM_SNAPSHOT_LIMIT, filter);
      const hash = alerts.map((alert) => alert.id).join(':');
      if (!hash || hash === previousSnapshotHash) {
        return;
      }
      previousSnapshotHash = hash;
      res.write(`event: snapshot\ndata: ${JSON.stringify({ alerts })}\n\n`);
    } catch (error) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'Failed to refresh alerts', details: (error as Error).message })}\n\n`);
    }
  };

  pushSnapshot();
  const snapshotInterval = setInterval(pushSnapshot, STREAM_SNAPSHOT_INTERVAL_MS);

  stream.on('data', (alert) => {
    res.write(`data: ${JSON.stringify(alert)}\n\n`);
  });

  stream.on('error', (err) => {
    res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
    cleanup();
  });

  req.on('close', cleanup);

  function cleanup() {
    if (closed) {
      return;
    }
    closed = true;
    clearInterval(heartbeat);
    clearInterval(snapshotInterval);
    stream.cancel();
    res.end();
  }
});

alertsRouter.post('/', async (req, res, next) => {
  try {
    const payload = buildSendAlertPayload(req.body ?? {});
    const ack = await sendAlert(payload);
    res.status(201).json({ ...ack, submittedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

function parseLimit(raw: unknown) {
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return 10;
  }
  return Math.min(parsed, 50);
}

function buildFilter(query: Request['query']): AlertFilterInput | undefined {
  const types = parseCsv(query.types);
  const zones = parseCsv(query.zones);
  const minimumSeverity = parseLimitNumber(query.minimumSeverity);
  if (!types.length && !zones.length && minimumSeverity === undefined) {
    return undefined;
  }
  return {
    types,
    zones,
    minimumSeverity,
  };
}

function parseCsv(value: unknown): string[] {
  if (!value) {
    return [];
  }
  const parts = Array.isArray(value) ? value : String(value).split(',');
  return parts
    .map((part) => part?.toString().trim())
    .filter((part): part is string => Boolean(part))
    .map((part) => part.toUpperCase());
}

function parseLimitNumber(value: unknown): number | undefined {
  if (value === undefined) {
    return undefined;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return undefined;
  }
  return Math.min(parsed, 3);
}

function buildSendAlertPayload(body: Record<string, unknown>): SendAlertInput {
  const type = requireString(body.type, 'type');
  const zone = requireString(body.zone, 'zone').toUpperCase();
  const severity = parseSeverity(body.severity);
  const description = typeof body.description === 'string' ? body.description.trim() : undefined;
  const id = typeof body.id === 'string' ? body.id.trim() : undefined;
  const timestamp = parseTimestamp(body.timestamp);
  return {
    id: id && id.length > 0 ? id : undefined,
    type,
    zone,
    description: description && description.length > 0 ? description : undefined,
    severity,
    timestamp,
  };
}

function requireString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw badRequest(`Le champ ${field} est requis.`);
  }
  return value.trim();
}

function parseSeverity(value: unknown): Severity | undefined {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return undefined;
  }
  const normalized = value.trim().toUpperCase();
  const allowed: Severity[] = ['SEVERITY_INFO', 'SEVERITY_WARNING', 'SEVERITY_CRITICAL'];
  if (!allowed.includes(normalized as Severity)) {
    throw badRequest('La sévérité doit être SEVERITY_INFO, SEVERITY_WARNING ou SEVERITY_CRITICAL.');
  }
  return normalized as Severity;
}

function parseTimestamp(value: unknown): number | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw badRequest('Le timestamp doit être un nombre positif.');
  }
  return numeric;
}

function badRequest(message: string) {
  const error = new Error(message) as Error & { status?: number };
  error.status = 400;
  return error;
}
