import { describe, expect, it } from 'vitest';
import { computeParetoFrontier, type FrontierPoint } from './pareto-frontier';

describe('computeParetoFrontier', () => {
  it('returns an empty array for no points', () => {
    expect(computeParetoFrontier([])).toEqual([]);
  });

  it('returns the single point when given one', () => {
    const points = [{ x: 5, y: 0.5 }];
    expect(computeParetoFrontier(points)).toEqual(points);
  });

  it('keeps only the best-y point when all x are equal (cost == 0 case)', () => {
    // Mirrors the legal fixture where every cost is 0 → the highest F1 dominates.
    const points: FrontierPoint[] = [
      { x: 0, y: 0.71 },
      { x: 0, y: 0.63 },
      { x: 0, y: 0.55 },
      { x: 0, y: 0.48 },
    ];
    expect(computeParetoFrontier(points)).toEqual([{ x: 0, y: 0.71 }]);
  });

  it('keeps every point on a monotonic perf-vs-latency tradeoff, sorted by x asc', () => {
    // F1 (y, higher better) vs latency (x, lower better) from the fixture.
    const points: FrontierPoint[] = [
      { x: 52000, y: 0.71 },
      { x: 38000, y: 0.63 },
      { x: 31000, y: 0.55 },
      { x: 22000, y: 0.48 },
    ];
    expect(computeParetoFrontier(points)).toEqual([
      { x: 22000, y: 0.48 },
      { x: 31000, y: 0.55 },
      { x: 38000, y: 0.63 },
      { x: 52000, y: 0.71 },
    ]);
  });

  it('drops dominated points (worse on both axes)', () => {
    const points: FrontierPoint[] = [
      { x: 10, y: 0.9 }, // frontier
      { x: 20, y: 0.95 }, // frontier (higher y)
      { x: 30, y: 0.85 }, // dominated by {10,0.9}
    ];
    expect(computeParetoFrontier(points)).toEqual([
      { x: 10, y: 0.9 },
      { x: 20, y: 0.95 },
    ]);
  });

  it('preserves the original payload on surviving points', () => {
    const points = [
      { x: 1, y: 0.8, label: 'cheap-good' },
      { x: 2, y: 0.5, label: 'dominated' },
    ];
    const frontier = computeParetoFrontier(points);
    expect(frontier).toEqual([{ x: 1, y: 0.8, label: 'cheap-good' }]);
  });
});
