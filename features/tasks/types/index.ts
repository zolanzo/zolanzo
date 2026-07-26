/**
 * Task Instance types — immutable marketplace inventory units.
 */

import type { GenerationStrategy } from "@/constants/generation-strategies";
import type {
  GenerationPolicy,
  GenerationPolicyConfig,
} from "@/constants/generation-policies";
import type { TaskInstanceStatus } from "@/constants/work-states";

export type TaskInstancePriority = "low" | "normal" | "high" | "urgent";

export type TaskInstanceRecord = {
  id: string;
  publicId: string;
  campaignId: string;
  taskTemplateId: string;
  taskTemplateVersion: number;
  sequenceNumber: number;
  generationStrategy: GenerationStrategy;
  generationPolicy: GenerationPolicy;
  generationPolicyConfig: GenerationPolicyConfig | null;
  status: TaskInstanceStatus;
  priority: TaskInstancePriority;
  reserved: boolean;
  reservedAt: string | null;
  expiresAt: string | null;
  campaignPublicId: string;
  templatePublicId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type InventoryCounts = {
  generated: number;
  available: number;
  reserved: number;
  claimed: number;
  expired: number;
  cancelled: number;
  completed: number;
};

export type InventoryAnalytics = InventoryCounts & {
  /** All instances ever created for the campaign */
  totalGenerated: number;
  remaining: number;
  consumed: number;
  projected: number;
  targetQuantity: number;
};

export type GenerationPreview = {
  campaignId: string;
  campaignPublicId: string;
  strategy: GenerationStrategy;
  policy: GenerationPolicy;
  expectedQuantity: number;
  rewardPerUnitMinor: number;
  projectedCostMinor: number;
  currency: string;
  inventoryBefore: InventoryAnalytics;
  inventoryAfterProjected: {
    totalGenerated: number;
    available: number;
    remaining: number;
  };
  errors: string[];
  ok: boolean;
};
