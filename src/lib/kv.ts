import { Redis } from "@upstash/redis";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";

const localStorePath = path.join(
  process.env.VERCEL ? "/tmp" : process.cwd(),
  ".data",
  "vote-store.json"
);
let localWriteQueue = Promise.resolve();
let localCache: Record<string, string> | null = null;
let redisClient: Redis | null | undefined;

function getRedis(): Redis | null {
  if (redisClient !== undefined) return redisClient;

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
      automaticDeserialization: false,
      readYourWrites: true,
    });
    return redisClient;
  }

  redisClient = null;
  return redisClient;
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

function voteHashKey(showId: string): string {
  return `votes_hash:${showId}`;
}

function votersHashKey(showId: string): string {
  return `voters_hash:${showId}`;
}

function devicesHashKey(showId: string): string {
  return `devices_hash:${showId}`;
}

function parseRecord(data: string | null): Record<string, number> {
  if (!data) return {};
  try {
    return JSON.parse(data) as Record<string, number>;
  } catch {
    return {};
  }
}

function normalizeNumberRecord(data: unknown): Record<string, number> {
  if (!data) return {};
  if (Array.isArray(data)) {
    const result: Record<string, number> = {};
    for (let index = 0; index < data.length; index += 2) {
      const key = String(data[index] ?? "");
      if (key) result[key] = Number(data[index + 1]) || 0;
    }
    return result;
  }

  if (typeof data !== "object") return {};

  return Object.fromEntries(
    Object.entries(data as Record<string, unknown>).map(([key, value]) => [key, Number(value) || 0])
  );
}

async function getVoteHash(showId: string): Promise<Record<string, number>> {
  const redis = getRedis();
  if (!redis) return {};
  const data = await redis.hgetall<Record<string, unknown>>(voteHashKey(showId));
  return normalizeNumberRecord(data);
}

async function migrateVotesToHash(showId: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;

  const hashVotes = await getVoteHash(showId);
  if (Object.keys(hashVotes).length > 0) return;

  const legacyVotes = parseRecord(await kvGet(`votes:${showId}`));
  const entries = Object.entries(legacyVotes).filter(([, value]) => value > 0);
  if (entries.length === 0) return;

  const pipeline = redis.pipeline();
  for (const [optionId, count] of entries) {
    pipeline.hset(voteHashKey(showId), { [optionId]: count });
  }
  pipeline.del(`votes:${showId}`);
  await pipeline.exec();
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
  const redis = getRedis();
  if (redis) {
    const hashVotes = await getVoteHash(showId);
    if (Object.keys(hashVotes).length > 0) return hashVotes;
  }

  return parseRecord(await kvGet(`votes:${showId}`));
}

export async function addVote(showId: string, optionId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await migrateVotesToHash(showId);
    await redis.hincrby(voteHashKey(showId), optionId, 1);
    return;
  }

  const votes = await getVotes(showId);
  votes[optionId] = (votes[optionId] || 0) + 1;
  await kvSet(`votes:${showId}`, JSON.stringify(votes));
}

export async function setVoteCount(
  showId: string,
  optionId: string,
  count: number
): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await migrateVotesToHash(showId);
    await redis.hset(voteHashKey(showId), { [optionId]: Math.max(0, Math.floor(count)) });
    return;
  }

  const votes = await getVotes(showId);
  votes[optionId] = Math.max(0, Math.floor(count));
  await kvSet(`votes:${showId}`, JSON.stringify(votes));
}

export async function resetVotes(showId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(
      `votes:${showId}`,
      voteHashKey(showId),
      `voters:${showId}`,
      votersHashKey(showId),
      `devices:${showId}`,
      devicesHashKey(showId)
    );
    return;
  }

  await updateLocalStore((store) => {
    store[`votes:${showId}`] = "{}";
    delete store[`voters:${showId}`];
    delete store[`devices:${showId}`];
  });
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

export type SubmitVoteResult = "success" | "closed" | "duplicate";

export async function submitVote(
  showId: string,
  optionId: string,
  voterToken: string,
  identityKeys: string[]
): Promise<SubmitVoteResult> {
  const redis = getRedis();
  if (redis) {
    await migrateVotesToHash(showId);
    const result = await redis.eval<[string, ...string[]], number>(
      `
      local current = redis.call("GET", KEYS[1])
      if current ~= ARGV[1] then
        return 2
      end
      if redis.call("HEXISTS", KEYS[3], ARGV[3]) == 1 then
        return 1
      end
      for i = 4, #ARGV do
        if redis.call("HEXISTS", KEYS[4], ARGV[i]) == 1 then
          return 1
        end
      end
      redis.call("HSET", KEYS[3], ARGV[3], "1")
      for i = 4, #ARGV do
        redis.call("HSET", KEYS[4], ARGV[i], "1")
      end
      redis.call("HINCRBY", KEYS[2], ARGV[2], 1)
      return 0
      `,
      ["current_show", voteHashKey(showId), votersHashKey(showId), devicesHashKey(showId)],
      [showId, optionId, voterToken, ...identityKeys]
    );

    if (result === 0) return "success";
    if (result === 1) return "duplicate";
    return "closed";
  }

  let result: SubmitVoteResult = "success";
  await updateLocalStore((store) => {
    if (store.current_show !== showId) {
      result = "closed";
      return;
    }

    const voters = JSON.parse(store[`voters:${showId}`] || "{}") as Record<string, boolean>;
    const devices = JSON.parse(store[`devices:${showId}`] || "{}") as Record<string, boolean>;
    if (voters[voterToken] || identityKeys.some((identityKey) => devices[identityKey])) {
      result = "duplicate";
      return;
    }

    const votes = JSON.parse(store[`votes:${showId}`] || "{}") as Record<string, number>;
    votes[optionId] = (votes[optionId] || 0) + 1;
    voters[voterToken] = true;
    for (const identityKey of identityKeys) {
      devices[identityKey] = true;
    }

    store[`votes:${showId}`] = JSON.stringify(votes);
    store[`voters:${showId}`] = JSON.stringify(voters);
    store[`devices:${showId}`] = JSON.stringify(devices);
  });

  return result;
}

// ====== Voter token dedup ======

export async function hasVoted(showId: string, voterToken: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const hashValue = await redis.hget(votersHashKey(showId), voterToken);
    if (hashValue) return true;
  }

  const data = await kvGet(`voters:${showId}`);
  if (!data) return false;
  return !!(JSON.parse(data) as Record<string, boolean>)[voterToken];
}

export async function markVoted(showId: string, voterToken: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.hset(votersHashKey(showId), { [voterToken]: 1 });
    return;
  }

  const data = await kvGet(`voters:${showId}`);
  const voters: Record<string, boolean> = data ? JSON.parse(data) : {};
  voters[voterToken] = true;
  await kvSet(`voters:${showId}`, JSON.stringify(voters));
}

// ====== Device fingerprint dedup ======

export async function hasDeviceVoted(showId: string, fingerprint: string): Promise<boolean> {
  const redis = getRedis();
  if (redis) {
    const hashValue = await redis.hget(devicesHashKey(showId), fingerprint);
    if (hashValue) return true;
  }

  const data = await kvGet(`devices:${showId}`);
  if (!data) return false;
  return !!(JSON.parse(data) as Record<string, boolean>)[fingerprint];
}

export async function markDeviceVoted(showId: string, fingerprint: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.hset(devicesHashKey(showId), { [fingerprint]: 1 });
    return;
  }

  const data = await kvGet(`devices:${showId}`);
  const devices: Record<string, boolean> = data ? JSON.parse(data) : {};
  devices[fingerprint] = true;
  await kvSet(`devices:${showId}`, JSON.stringify(devices));
}

export async function enableRevote(showId: string): Promise<void> {
  const redis = getRedis();
  if (redis) {
    await redis.del(`voters:${showId}`, votersHashKey(showId), `devices:${showId}`, devicesHashKey(showId));
    return;
  }

  await updateLocalStore((store) => {
    delete store[`voters:${showId}`];
    delete store[`devices:${showId}`];
  });
}
