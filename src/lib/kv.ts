const localStore = new Map<string, string>();

function kvEnabled() {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function kvGet(key: string): Promise<string | null> {
  if (kvEnabled()) {
    const { kv } = await import("@vercel/kv");
    return kv.get<string>(key);
  }
  return localStore.get(key) ?? null;
}

async function kvSet(key: string, value: string): Promise<void> {
  if (kvEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.set(key, value);
    return;
  }
  localStore.set(key, value);
}

async function kvDel(key: string): Promise<void> {
  if (kvEnabled()) {
    const { kv } = await import("@vercel/kv");
    await kv.del(key);
    return;
  }
  localStore.delete(key);
}

export async function getVotes(
  showId: string
): Promise<Record<string, number>> {
  const data = await kvGet(`votes:${showId}`);
  return data ? JSON.parse(data) : {};
}

export async function addVote(
  showId: string,
  optionId: string
): Promise<void> {
  const votes = await getVotes(showId);
  votes[optionId] = (votes[optionId] || 0) + 1;
  await kvSet(`votes:${showId}`, JSON.stringify(votes));
}

export async function resetVotes(showId: string): Promise<void> {
  await kvSet(`votes:${showId}`, "{}");
  await kvDel(`voters:${showId}`);
}

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

export async function hasVoted(
  showId: string,
  voterToken: string
): Promise<boolean> {
  const data = await kvGet(`voters:${showId}`);
  if (!data) return false;
  const voters: Record<string, boolean> = JSON.parse(data);
  return !!voters[voterToken];
}

export async function markVoted(
  showId: string,
  voterToken: string
): Promise<void> {
  const data = await kvGet(`voters:${showId}`);
  const voters: Record<string, boolean> = data ? JSON.parse(data) : {};
  voters[voterToken] = true;
  await kvSet(`voters:${showId}`, JSON.stringify(voters));
}
