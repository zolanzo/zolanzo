/**
 * Time decay — recent behavior weighs more than old history.
 */

import { getTrustDecayHalfLifeDays } from "@/lib/trust/config";

/**
 * Exponential half-life decay.
 * ageDays = 0 → 1; ageDays = halfLife → 0.5.
 */
export function trustDecayFactor(
  ageDays: number,
  halfLifeDays: number = getTrustDecayHalfLifeDays(),
): number {
  if (!Number.isFinite(ageDays) || ageDays <= 0) return 1;
  if (!Number.isFinite(halfLifeDays) || halfLifeDays <= 0) return 1;
  return Math.pow(0.5, ageDays / halfLifeDays);
}

export function ageDaysSince(iso: string, now: Date = new Date()): number {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return 0;
  return Math.max(0, (now.getTime() - t) / 86_400_000);
}

export function applyDecayToWeight(params: {
  rawWeight: number;
  occurredAt: string;
  now?: Date;
  halfLifeDays?: number;
}): { decayedWeight: number; decayFactor: number; ageDays: number } {
  const ageDays = ageDaysSince(params.occurredAt, params.now);
  const decayFactor = trustDecayFactor(ageDays, params.halfLifeDays);
  return {
    ageDays,
    decayFactor,
    decayedWeight: params.rawWeight * decayFactor,
  };
}
