/**
 * Inventory analytics for Task Instances.
 */

import type {
  InventoryAnalytics,
  InventoryCounts,
} from "@/features/tasks/types";

export function emptyInventoryCounts(): InventoryCounts {
  return {
    generated: 0,
    available: 0,
    reserved: 0,
    claimed: 0,
    expired: 0,
    cancelled: 0,
    completed: 0,
  };
}

export function buildInventoryAnalytics(params: {
  counts: InventoryCounts;
  targetQuantity: number;
}): InventoryAnalytics {
  const { counts, targetQuantity } = params;
  const totalGenerated =
    counts.generated +
    counts.available +
    counts.reserved +
    counts.claimed +
    counts.expired +
    counts.cancelled +
    counts.completed;
  const consumed = counts.claimed + counts.completed;
  const remaining = Math.max(0, targetQuantity - totalGenerated);
  const projected = Math.min(targetQuantity, totalGenerated + counts.available);

  return {
    ...counts,
    totalGenerated,
    remaining,
    consumed,
    projected,
    targetQuantity,
  };
}

/**
 * Project inventory after creating `quantity` new available instances.
 */
export function projectInventoryAfterGeneration(params: {
  analytics: InventoryAnalytics;
  quantity: number;
}): {
  totalGenerated: number;
  available: number;
  remaining: number;
} {
  const totalGenerated = params.analytics.totalGenerated + params.quantity;
  const available = params.analytics.available + params.quantity;
  const remaining = Math.max(
    0,
    params.analytics.targetQuantity - totalGenerated,
  );
  return { totalGenerated, available, remaining };
}
