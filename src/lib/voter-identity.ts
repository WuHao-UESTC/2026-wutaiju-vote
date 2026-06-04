import { NextRequest } from "next/server";

function cleanPart(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9._:-]/g, "_").slice(0, 160);
}

export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  return forwardedFor || realIp || cfIp || "";
}

export function buildVoterIdentityKeys(request: NextRequest, deviceFingerprint?: string | null): string[] {
  const ip = getClientIp(request);
  const fingerprint = deviceFingerprint?.trim();
  const keys = new Set<string>();

  if (fingerprint) {
    keys.add(fingerprint);
    keys.add(`fp:${cleanPart(fingerprint)}`);
  }

  if (ip && fingerprint) {
    keys.add(`ip-fp:${cleanPart(ip)}:${cleanPart(fingerprint)}`);
  }

  return [...keys];
}
