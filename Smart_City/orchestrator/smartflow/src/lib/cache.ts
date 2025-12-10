import Redis, { RedisOptions } from 'ioredis';

const ttlDefault = Number(process.env.CACHE_DEFAULT_TTL ?? 300);
const redisUrl = process.env.REDIS_URL;

let redisClient: Redis | null = null;
const memoryStore = new Map<string, { value: string; expiresAt: number }>();

function initRedis() {
  if (!redisUrl || redisClient) {
    return;
  }
  const options: RedisOptions = { lazyConnect: true };
  redisClient = new Redis(redisUrl, options);
  redisClient.on('error', (err: Error) => {
    console.error('Redis error', err.message);
  });
}

export async function getCache<T>(key: string): Promise<T | undefined> {
  initRedis();
  if (redisClient) {
    try {
      const cached = await redisClient.get(key);
      return cached ? (JSON.parse(cached) as T) : undefined;
    } catch (err) {
      console.warn('Redis get failed, fallback to memory cache', err);
    }
  }
  const entry = memoryStore.get(key);
  if (!entry || entry.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return undefined;
  }
  return JSON.parse(entry.value) as T;
}

export async function setCache<T>(key: string, value: T, ttlSeconds = ttlDefault): Promise<void> {
  initRedis();
  const serialized = JSON.stringify(value);
  if (redisClient) {
    try {
      await redisClient.set(key, serialized, 'EX', ttlSeconds);
      return;
    } catch (err) {
      console.warn('Redis set failed, writing to memory cache', err);
    }
  }
  memoryStore.set(key, { value: serialized, expiresAt: Date.now() + ttlSeconds * 1000 });
}
