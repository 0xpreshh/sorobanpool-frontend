// Pure helpers for the admin screens. Kept out of page files because Next.js
// only allows default and route-config exports from `page.tsx`.

export const MASK = '••••';

const SENSITIVE_KEY = /secret|token|password|passcode|bvn|\bnin\b|account|phone|email|address|signature|private/i;

export function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEY.test(key);
}

/** `supplierAccountId` -> `supplier account id`. */
export function humanizeKey(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .toLowerCase();
}

export function formatDetailValue(key: string, value: unknown): string {
  if (isSensitiveKey(key)) return MASK;
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export interface DetailRow {
  key: string;
  label: string;
  value: string;
}

/** Key/value rows for an audit entry's data payload, sorted, with sensitive fields masked. */
export function readableDetails(data?: Record<string, unknown>): DetailRow[] {
  if (!data) return [];
  return Object.keys(data)
    .sort()
    .map((key) => ({ key, label: humanizeKey(key), value: formatDetailValue(key, data[key]) }));
}

export type DisputeState = 'OPEN' | 'RESOLVED' | 'TIMED_OUT';

export interface DisputeLike {
  id: string;
  poolId: string;
  state: DisputeState;
  openedAt: string;
  slaDueAt: string;
  resolvedAt?: string;
  arbiterId?: string;
}

export interface DisputeOverview {
  total: number;
  counts: Record<DisputeState, number>;
  breached: DisputeLike[];
  avgResolutionMs: number | null;
  workload: { arbiterId: string; open: number }[];
}

const DAY_MS = 86_400_000;

/**
 * Summarises disputes opened within the last `windowDays`.
 * An OPEN dispute is in SLA breach when its due time has passed.
 */
export function disputeOverview(
  disputes: DisputeLike[],
  windowDays: number,
  now: number = Date.now(),
): DisputeOverview {
  const since = now - windowDays * DAY_MS;
  const inWindow = disputes.filter((d) => Date.parse(d.openedAt) >= since);

  const counts: Record<DisputeState, number> = { OPEN: 0, RESOLVED: 0, TIMED_OUT: 0 };
  for (const d of inWindow) counts[d.state] += 1;

  const breached = inWindow
    .filter((d) => d.state === 'OPEN' && Date.parse(d.slaDueAt) < now)
    .sort((a, b) => Date.parse(a.slaDueAt) - Date.parse(b.slaDueAt));

  const resolved = inWindow.filter((d) => d.state === 'RESOLVED' && d.resolvedAt);
  const avgResolutionMs = resolved.length
    ? resolved.reduce((sum, d) => sum + (Date.parse(d.resolvedAt as string) - Date.parse(d.openedAt)), 0) /
      resolved.length
    : null;

  const byArbiter = new Map<string, number>();
  for (const d of inWindow) {
    if (d.state !== 'OPEN') continue;
    const key = d.arbiterId ?? 'Unassigned';
    byArbiter.set(key, (byArbiter.get(key) ?? 0) + 1);
  }
  const workload = [...byArbiter.entries()]
    .map(([arbiterId, open]) => ({ arbiterId, open }))
    .sort((a, b) => b.open - a.open);

  return { total: inWindow.length, counts, breached, avgResolutionMs, workload };
}

/** Human-readable duration: `36h 5m`, `2d 4h`, or `—` when there is no data. */
export function formatDuration(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return '—';
  const totalMinutes = Math.round(ms / 60_000);
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes}m`;
}
