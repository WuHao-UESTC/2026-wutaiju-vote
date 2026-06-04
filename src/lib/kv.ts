import { Redis } from "@upstash/redis";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

const localStorePath = path.join(process.cwd(), ".data", "vote-store.json");
let localWriteQueue = Promise.resolve();
let localCache: Record<string, string> | null = null;

function getRedis(): Redis | null {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      automaticDeserialization: false,
      readYourWrites: true,
    });
  }
  return null;
}

async function kvGet(key: string): Promise<string | null> {
  const redis = getRedis();
  if (redis) return redis.get<string>(key);
  const store = await readLocalStore();
  return store[key] ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.set(key, value);
    return;
  }
  await updateLocalStore((store) => {
    store[key] = value;
  });
}

async function kvDel(key: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(key);
    return;
  }
  await updateLocalStore((store) => {
    delete store[key];
  });
}

async function readLocalStore(): Promise<Record<string, string>> {
  if (localCache) return localCache;

  try {
    const data = await readFile(localStorePath, "utf8");
    localCache = JSON.parse(data) as Record<string, string>;
  } catch {
    localCache = {};
  }

  return localCache;
}

async function writeLocalStore(store: Record<string, string>): Promise<void> {
  const dir = path.dirname(localStorePath);
  const tempPath = `${localStorePath}.${process.pid}.tmp`;
  await mkdir(dir, { recursive: true });
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, localStorePath);
}

async function updateLocalStore(mutator: (store: Record<string, string>) => void): Promise<void> {
  localWriteQueue = localWriteQueue.then(async () => {
    localCache = null;
    const store = await readLocalStore();
    mutator(store);
    localCache = store;
    await writeLocalStore(store);
  });
  await localWriteQueue;
}

// ====== Vote counts ======

export async function getVotes(showId: string): Promise<Record<string, number>> {
  const data = await kvGet(`votes:${showId}`);
  return data ? JSON.parse(data) : {};
}

export async function addVote(showId: string, optionId: string): Promise<void> {
  const votes = await getVotes(showId);
  votes[optionId] = (votes[optionId] || 0) + 1;
  await kvSet(`votes:${showId}`, JSON.stringify(votes));
}

export async function setVoteCount(
  showId: string,
  optionId: string,
  count: number
): Promise<void> {
  const votes = await getVotes(showId);
  votes[optionId] = Math.max(0, Math.floor(count));
  await kvSet(`votes:${showId}`, JSON.stringify(votes));
}

export async function resetVotes(showId: string): Promise<void> {
  await kvSet(`votes:${showId}`, "{}");
  await kvDel(`voters:${showId}`);
  await kvDel(`devices:${showId}`);
}

// ====== Current show ======

export async function getCurrentShow(): Promise<string | null> {
  return kvGet("current_show");
}

export async function setCurrentShow(showId: string | null): Promise<void> {
  if (showId) {
    await kvSet("current_show", showId);
  } else {
    await kvDel("current_show");
  }
}

// ====== Voter token dedup ======

export async function hasVoted(showId: string, voterToken: string): Promise<boolean> {
  const data = await kvGet(`voters:${showId}`);
  if (!data) return false;
  return !!(JSON.parse(data) as Record<string, boolean>)[voterToken];
}

export async function markVoted(showId: string, voterToken: string): Promise<void> {
  const data = await kvGet(`voters:${showId}`);
  const voters: Record<string, boolean> = data ? JSON.parse(data) : {};
  voters[voterToken] = true;
  await kvSet(`voters:${showId}`, JSON.stringify(voters));
}

// ====== Device fingerprint dedup ======

export async function hasDeviceVoted(showId: string, fingerprint: string): Promise<boolean> {
  const data = await kvGet(`devices:${showId}`);
  if (!data) return false;
  return !!(JSON.parse(data) as Record<string, boolean>)[fingerprint];
}

export async function markDeviceVoted(showId: string, fingerprint: string): Promise<void> {
  const data = await kvGet(`devices:${showId}`);
  const devices: Record<string, boolean> = data ? JSON.parse(data) : {};
  devices[fingerprint] = true;
  await kvSet(`devices:${showId}`, JSON.stringify(devices));
}

export async function enableRevote(showId: string): Promise<void> {
  await kvDel(`voters:${showId}`);
  await kvDel(`devices:${showId}`);
}
