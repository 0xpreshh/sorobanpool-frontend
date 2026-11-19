import { describe, expect, it } from 'vitest';
import { disputeOverview, formatDetailValue, formatDuration, humanizeKey, readableDetails } from './adminView';

describe('audit detail formatting', () => {
  it('masks sensitive keys and leaves other values readable', () => {
    expect(formatDetailValue('supplierBvn', '22233344455')).toBe('••••');
    expect(formatDetailValue('accessToken', 'abc')).toBe('••••');
    expect(formatDetailValue('fee', '10')).toBe('10');
    expect(formatDetailValue('note', null)).toBe('—');
    expect(formatDetailValue('items', ['a'])).toBe('["a"]');
  });

  it('humanizes keys', () => {
    expect(humanizeKey('supplierAccount_id')).toBe('supplier account id');
  });

  it('returns sorted rows and none for missing data', () => {
    expect(readableDetails(undefined)).toEqual([]);
    expect(readableDetails({ b: 1, a: 'x' }).map((r) => r.key)).toEqual(['a', 'b']);
  });
});

describe('dispute overview', () => {
  const now = Date.parse('2026-10-20T00:00:00Z');
  const h = (hours: number) => new Date(now + hours * 3_600_000).toISOString();

  it('counts within the window and finds open disputes past SLA', () => {
    const out = disputeOverview(
      [
        { id: 'a', poolId: 'p', state: 'OPEN', openedAt: h(-100), slaDueAt: h(-10), arbiterId: 'x' },
        { id: 'b', poolId: 'p', state: 'OPEN', openedAt: h(-1), slaDueAt: h(10) },
        { id: 'c', poolId: 'p', state: 'RESOLVED', openedAt: h(-30), slaDueAt: h(0), resolvedAt: h(-6) },
      ],
      7,
      now,
    );
    expect(out.total).toBe(3);
    expect(out.counts).toEqual({ OPEN: 2, RESOLVED: 1, TIMED_OUT: 0 });
    expect(out.breached.map((d) => d.id)).toEqual(['a']); // open and past SLA; 'b' is still within SLA
  });

  it('computes average resolution and workload', () => {
    const out = disputeOverview(
      [
        { id: 'r1', poolId: 'p', state: 'RESOLVED', openedAt: h(-20), slaDueAt: h(0), resolvedAt: h(-10) },
        { id: 'r2', poolId: 'p', state: 'RESOLVED', openedAt: h(-20), slaDueAt: h(0), resolvedAt: h(-14) },
        { id: 'o1', poolId: 'p', state: 'OPEN', openedAt: h(-2), slaDueAt: h(5), arbiterId: 'arb' },
        { id: 'o2', poolId: 'p', state: 'OPEN', openedAt: h(-2), slaDueAt: h(5) },
      ],
      30,
      now,
    );
    expect(out.avgResolutionMs).toBe(8 * 3_600_000); // (10h + 6h) / 2
    expect(out.workload).toEqual([
      { arbiterId: 'Unassigned', open: 1 },
      { arbiterId: 'arb', open: 1 },
    ]);
  });

  it('formats durations', () => {
    expect(formatDuration(null)).toBe('—');
    expect(formatDuration(90 * 60_000)).toBe('1h 30m');
    expect(formatDuration(50 * 3_600_000)).toBe('2d 2h');
  });
});
