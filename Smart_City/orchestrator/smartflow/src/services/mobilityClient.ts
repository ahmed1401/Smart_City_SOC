import axios from 'axios';
import pRetry from 'p-retry';

type Line = {
  id: string;
  name: string;
  mode: string;
  status: string;
};

type Arrival = {
  lineId: string;
  etaMinutes: number;
};

const baseURL = process.env.MOBILITY_BASE_URL ?? 'http://mobility-rest:8080/mobility/api';
const client = axios.create({ baseURL, timeout: 2000 });

export async function fetchLines(mode?: string): Promise<Line[]> {
  return pRetry(async () => {
    const response = await client.get('/lines', { params: { mode } });
    return response.data;
  }, { retries: 2 });
}

export async function fetchArrivals(stopId: string): Promise<Arrival[]> {
  return pRetry(async () => {
    const response = await client.get(`/stops/${stopId}/arrivals`);
    return response.data;
  }, { retries: 2 });
}
