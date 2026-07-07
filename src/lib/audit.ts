import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";
import { formatAuditActorName } from "./audit-format";
import type { AuditAction, AuditEvent } from "./types";

const AUDIT_GLOBAL_KEY = "audit:events";
const AUDIT_TABLE_KEY_PREFIX = "audit:table:";
const RETENTION_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_AUDIT_SCAN = 1000;
const DEFAULT_AUDIT_PAGE_SIZE = 20;

export interface AuditActorOption {
  id: string;
  name: string | null;
  email: string | null;
}

export interface AuditEventsResult {
  events: AuditEvent[];
  total: number;
  actors: AuditActorOption[];
  limit: number;
  offset: number;
}

export interface AuditActor {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
}

export interface RecordAuditInput {
  action: AuditAction;
  actor: AuditActor;
  tableSlug: string;
  tableName: string | null;
  summary: string;
  before?: string | null;
  after?: string | null;
  target?: string | null;
}

function getRedis(): Redis {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Missing Redis credentials. Set UPSTASH_REDIS_REST_URL/TOKEN or KV_REST_API_URL/TOKEN.",
    );
  }

  return new Redis({ url, token });
}

function tableAuditKey(slug: string): string {
  return `${AUDIT_TABLE_KEY_PREFIX}${slug}`;
}

function parseAuditEvent(raw: unknown): AuditEvent | null {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as AuditEvent;
    } catch {
      return null;
    }
  }

  if (raw && typeof raw === "object" && "id" in raw && "action" in raw) {
    return raw as AuditEvent;
  }

  return null;
}

async function trimExpiredEvents(redis: Redis, key: string): Promise<void> {
  const cutoff = Date.now() - RETENTION_MS;
  await redis.zremrangebyscore(key, 0, cutoff);
}

export async function recordAuditEvent(input: RecordAuditInput): Promise<void> {
  const redis = getRedis();
  const event: AuditEvent = {
    id: nanoid(),
    timestamp: new Date().toISOString(),
    action: input.action,
    actorId: input.actor.id,
    actorName: input.actor.name,
    actorEmail: input.actor.email,
    actorImage: input.actor.image,
    tableSlug: input.tableSlug,
    tableName: input.tableName,
    summary: input.summary,
    before: input.before ?? null,
    after: input.after ?? null,
    target: input.target ?? null,
  };

  const score = Date.parse(event.timestamp);
  const payload = JSON.stringify(event);

  await redis.zadd(AUDIT_GLOBAL_KEY, { score, member: payload });
  await redis.zadd(tableAuditKey(input.tableSlug), { score, member: payload });

  await trimExpiredEvents(redis, AUDIT_GLOBAL_KEY);
  await trimExpiredEvents(redis, tableAuditKey(input.tableSlug));
}

function collectAuditActors(events: AuditEvent[]): AuditActorOption[] {
  const actorMap = new Map<string, AuditActorOption>();

  for (const event of events) {
    if (actorMap.has(event.actorId)) continue;
    actorMap.set(event.actorId, {
      id: event.actorId,
      name: event.actorName,
      email: event.actorEmail,
    });
  }

  return [...actorMap.values()].sort((left, right) =>
    formatAuditActorName(left.name, left.email).localeCompare(
      formatAuditActorName(right.name, right.email),
    ),
  );
}

export async function getAuditEvents(options?: {
  tableSlug?: string;
  actorId?: string;
  offset?: number;
  limit?: number;
}): Promise<AuditEventsResult> {
  const redis = getRedis();
  const limit = options?.limit ?? DEFAULT_AUDIT_PAGE_SIZE;
  const offset = Math.max(0, options?.offset ?? 0);
  const key = options?.tableSlug
    ? tableAuditKey(options.tableSlug)
    : AUDIT_GLOBAL_KEY;

  await trimExpiredEvents(redis, key);

  const raw = await redis.zrange<string[]>(key, 0, MAX_AUDIT_SCAN - 1, {
    rev: true,
  });
  const allEvents = (raw ?? [])
    .map(parseAuditEvent)
    .filter((event): event is AuditEvent => event !== null);

  const actors = collectAuditActors(allEvents);
  const filtered = options?.actorId
    ? allEvents.filter((event) => event.actorId === options.actorId)
    : allEvents;

  return {
    events: filtered.slice(offset, offset + limit),
    total: filtered.length,
    actors,
    limit,
    offset,
  };
}
