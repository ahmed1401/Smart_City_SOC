import { readAuthState } from '../utils/auth';
const gatewayUrl = import.meta.env.VITE_GATEWAY_URL ?? 'http://localhost:8000';
const baseUrl = gatewayUrl.replace(/\/$/, '');
function buildUrl(path, searchParams) {
    const url = new URL(path.startsWith('http') ? path : `${baseUrl}${path}`);
    if (searchParams) {
        Object.entries(searchParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                url.searchParams.set(key, String(value));
            }
        });
    }
    return url.toString();
}
export async function http(path, options = {}) {
    const url = buildUrl(path, options.searchParams);
    const auth = readAuthState();
    const response = await fetch(url, {
        ...options,
        headers: {
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...(auth.apiKey ? { 'x-api-key': auth.apiKey } : {}),
            ...(auth.jwt ? { Authorization: `Bearer ${auth.jwt}` } : {}),
            ...(options.headers ?? {}),
        },
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gateway error ${response.status}: ${errorBody}`);
    }
    return response.json();
}
export async function graphQL(query, variables) {
    const auth = readAuthState();
    const response = await fetch(`${baseUrl}/api/directory`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(auth.apiKey ? { 'x-api-key': auth.apiKey } : {}),
            ...(auth.jwt ? { Authorization: `Bearer ${auth.jwt}` } : {}),
        },
        body: JSON.stringify({ query, variables }),
    });
    const payload = await response.json();
    if (!response.ok || payload.errors) {
        throw new Error(payload.errors?.[0]?.message ?? 'GraphQL error');
    }
    return payload.data;
}
export const GatewayPaths = {
    overview: (zone) => `/api/smartflow/metrics/overview?zoneCode=${encodeURIComponent(zone)}`,
    tripPlan: '/api/smartflow/trip-plan',
    alertsStream: '/api/smartflow/alerts/stream',
    alertsRecent: '/api/smartflow/alerts/recent',
    alertsSend: '/api/smartflow/alerts',
};
export const gatewayBaseUrl = baseUrl;
