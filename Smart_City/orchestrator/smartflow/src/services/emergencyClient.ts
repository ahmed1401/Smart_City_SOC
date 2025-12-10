import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { credentials, loadPackageDefinition, ClientReadableStream, ChannelCredentials } from '@grpc/grpc-js';
import protoLoader from '@grpc/proto-loader';

const protoPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'contracts',
  'grpc',
  'emergency.proto',
);

const packageDefinition = protoLoader.loadSync(protoPath, {
  keepCase: true,
  enums: String,
  defaults: true,
  oneofs: true,
  longs: String,
});

const descriptor = loadPackageDefinition(packageDefinition) as unknown as {
  smartcity: {
    emergency: {
      EmergencyService: new (address: string, creds: ChannelCredentials) => EmergencyServiceClient;
    };
  };
};

export type Severity = 'SEVERITY_UNSPECIFIED' | 'SEVERITY_INFO' | 'SEVERITY_WARNING' | 'SEVERITY_CRITICAL';

export type Alert = {
  id: string;
  type: string;
  zone: string;
  description?: string;
  timestamp: number;
  severity: Severity;
};

type AlertFilterWire = {
  types?: string[];
  zones?: string[];
  minimum_severity?: number;
};

type EmergencyServiceClient = {
  GetRecentAlerts: (
    request: { limit?: number; filter?: AlertFilterWire },
    callback: (error: Error | null, response: { alerts: Alert[] }) => void,
  ) => void;
  SubscribeAlerts: (request: AlertFilterWire) => ClientReadableStream<Alert>;
  SendAlert: (
    request: Alert,
    callback: (error: Error | null, response: { alert_id: string; accepted: boolean }) => void,
  ) => void;
};

export type AlertFilterInput = {
  types?: string[];
  zones?: string[];
  minimumSeverity?: number;
};

export type SendAlertInput = {
  id?: string;
  type: string;
  zone: string;
  description?: string;
  severity?: Severity;
  timestamp?: number;
};

let client: EmergencyServiceClient | null = null;

function ensureClient(): EmergencyServiceClient {
  if (!client) {
    const target = process.env.EMERGENCY_GRPC_URL ?? 'emergency-service:50051';
    const EmergencyService = descriptor.smartcity.emergency.EmergencyService;
    client = new EmergencyService(target, credentials.createInsecure());
  }
  return client;
}

export function fetchRecentAlerts(limit = 5, filter?: AlertFilterInput): Promise<Alert[]> {
  const payload = {
    limit,
    filter: filter
      ? {
          types: filter.types,
          zones: filter.zones,
          minimum_severity: filter.minimumSeverity,
        }
      : undefined,
  };
  return new Promise((resolve, reject) => {
    ensureClient().GetRecentAlerts(payload, (err, response) => {
      if (err) {
        reject(err);
      } else {
        resolve(response.alerts ?? []);
      }
    });
  });
}

export function subscribeAlertsStream(filter?: AlertFilterInput) {
  const payload: AlertFilterWire = {
    types: filter?.types,
    zones: filter?.zones,
    minimum_severity: filter?.minimumSeverity ?? 0,
  };
  return ensureClient().SubscribeAlerts(payload);
}

export function sendAlert(input: SendAlertInput) {
  const payload: Alert = {
    id: input.id ?? '',
    type: input.type,
    zone: input.zone,
    description: input.description ?? '',
    timestamp: normalizeTimestamp(input.timestamp),
    severity: input.severity ?? 'SEVERITY_INFO',
  };
  return new Promise<{ alertId: string; accepted: boolean }>((resolve, reject) => {
    ensureClient().SendAlert(payload, (err, response) => {
      if (err) {
        reject(err);
        return;
      }
      resolve({ alertId: response.alert_id, accepted: response.accepted });
    });
  });
}

function normalizeTimestamp(value: number | undefined) {
  if (!value || value <= 0) {
    return 0;
  }
  if (value > 1e12) {
    return Math.floor(value / 1000);
  }
  return Math.floor(value);
}
