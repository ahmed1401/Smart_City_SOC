import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import pRetry from 'p-retry';

import { getCache, setCache } from '../lib/cache.js';

const parser = new XMLParser({ ignoreAttributes: false });
const soapUrl = process.env.AIRQUALITY_SOAP_URL ?? 'http://airquality-soap:8081/airquality';

export type AQIReport = {
  zoneCode: string;
  value: number;
  category: string;
  recommendation: string;
  stale?: boolean;
};

export type PollutantLevel = {
  name: string;
  value: number;
  unit: string;
};

export type PollutantResponse = {
  zoneCode: string;
  pollutants: PollutantLevel[];
};

const cacheKey = (zoneCode: string) => `aqi:${zoneCode.toUpperCase()}`;
const pollutantsCacheKey = (zoneCode: string) => `pollutants:${zoneCode.toUpperCase()}`;

// SOAP runtimes shift namespace prefixes, so normalize the envelope/body tree first.
function extractReportNode(parsed: Record<string, any>) {
  const envelope = parsed['S:Envelope'] ?? parsed['soapenv:Envelope'] ?? parsed['Envelope'];
  const body = envelope?.['S:Body'] ?? envelope?.['soapenv:Body'] ?? envelope?.Body ?? parsed['S:Body'];
  const response = body?.['ns2:GetAQIResponse'] ?? body?.['GetAQIResponse'] ?? firstObject(body);
  const candidates = [
    response?.return,
    response?.AQIReport,
    response?.['ns2:return'],
    response?.['ns2:AQIReport'],
    firstObject(response),
  ];
  const report = candidates.find((value) => value && typeof value === 'object');
  if (!report) {
    throw new Error('Invalid SOAP response: missing AQI report payload');
  }
  return report;
}

function firstObject(node?: Record<string, any>) {
  if (!node || typeof node !== 'object') {
    return undefined;
  }
  return Object.values(node).find((value) => value && typeof value === 'object');
}

async function callSoap(zoneCode: string): Promise<AQIReport> {
  const envelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:aq="http://smartcity.example.com/airquality">` +
    `<soapenv:Body><aq:GetAQI><zoneCode>${zoneCode}</zoneCode></aq:GetAQI></soapenv:Body></soapenv:Envelope>`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await axios.post(soapUrl, envelope, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'GetAQI',
      },
      signal: controller.signal,
    });
    const parsed = parser.parse(response.data);
    const report = extractReportNode(parsed);
    return {
      zoneCode: report.zoneCode,
      value: Number(report.value),
      category: report.category,
      recommendation: report.recommendation,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchAQI(zoneCode: string): Promise<AQIReport> {
  const cached = await getCache<AQIReport>(cacheKey(zoneCode));
  try {
    const fresh = await pRetry(() => callSoap(zoneCode), { retries: 2, minTimeout: 500, factor: 2 });
    await setCache(cacheKey(zoneCode), fresh, 300);
    return fresh;
  } catch (error) {
    if (cached) {
      console.warn('SOAP call failed, returning cached AQI', error);
      return { ...cached, stale: true };
    }
    throw error;
  }
}

function extractPollutantResponse(parsed: Record<string, any>) {
  const envelope = parsed['S:Envelope'] ?? parsed['soapenv:Envelope'] ?? parsed['Envelope'];
  const body = envelope?.['S:Body'] ?? envelope?.['soapenv:Body'] ?? envelope?.Body ?? parsed['S:Body'];
  const response =
    body?.['ns2:GetPollutantsResponse'] ?? body?.GetPollutantsResponse ?? firstObject(body);
  const payload =
    response?.return ?? response?.PollutantResponse ?? response?.pollutants ?? firstObject(response);
  if (!payload) {
    throw new Error('Invalid SOAP response: missing pollutants payload');
  }
  const rawList = payload.pollutants ?? payload.PollutantLevel ?? payload;
  const list = Array.isArray(rawList) ? rawList : rawList ? [rawList] : [];
  const zoneCode = payload.zoneCode ?? payload.zone ?? '';
  const pollutants: PollutantLevel[] = list
    .map((item) => ({
      name: item?.name ?? 'N/A',
      value: Number(item?.value ?? 0),
      unit: item?.unit ?? 'µg/m3',
    }))
    .filter((item) => item.name !== 'N/A' || item.value !== 0);
  return { zoneCode, pollutants } as PollutantResponse;
}

async function callPollutants(zoneCode: string): Promise<PollutantResponse> {
  const envelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:aq="http://smartcity.example.com/airquality">` +
    `<soapenv:Body><aq:GetPollutants><zoneCode>${zoneCode}</zoneCode></aq:GetPollutants></soapenv:Body></soapenv:Envelope>`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await axios.post(soapUrl, envelope, {
      headers: {
        'Content-Type': 'text/xml;charset=UTF-8',
        SOAPAction: 'GetPollutants',
      },
      signal: controller.signal,
    });
    const parsed = parser.parse(response.data);
    return extractPollutantResponse(parsed);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPollutants(zoneCode: string): Promise<PollutantResponse> {
  const cacheId = pollutantsCacheKey(zoneCode);
  const cached = await getCache<PollutantResponse>(cacheId);
  try {
    const fresh = await pRetry(() => callPollutants(zoneCode), { retries: 2, minTimeout: 500, factor: 2 });
    await setCache(cacheId, fresh, 300);
    return fresh;
  } catch (error) {
    if (cached) {
      console.warn('SOAP call failed, returning cached pollutants', error);
      return cached;
    }
    throw error;
  }
}
