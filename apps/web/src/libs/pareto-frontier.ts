// Tessera: perf-vs-cost Pareto frontier helper for the legal leaderboard.
// Convention: HIGHER `y` is better (e.g. F1), LOWER `x` is better (cost or latency).
// A point A dominates B when A is at least as good on both axes and strictly
// better on at least one. The frontier is the set of non-dominated points.

export interface FrontierPoint {
  x: number;
  y: number;
}

/**
 * Compute the non-dominated (Pareto-optimal) subset of `points`.
 * Returns the survivors sorted by ascending `x` so they can be drawn as a line.
 */
export function computeParetoFrontier<T extends FrontierPoint>(points: readonly T[]): T[] {
  const nonDominated = points.filter(
    (p) => !points.some((q) => q !== p && q.x <= p.x && q.y >= p.y && (q.x < p.x || q.y > p.y)),
  );

  return [...nonDominated].sort((a, b) => a.x - b.x || b.y - a.y);
}
