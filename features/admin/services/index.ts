/**
 * @module features/admin/services
 */
export { getCommandCenter } from "@/features/admin/services/command-center";
export { executeOperationCommand } from "@/features/admin/services/operation-commands";
export { listOperationalQueue } from "@/features/admin/services/queues";
export { searchAuditExplorer } from "@/features/admin/services/audit-explorer";
export { getHealthDashboard } from "@/features/admin/services/health";
export {
  getOperationalView,
  getAllOperationalViews,
} from "@/features/admin/services/views-service";
export {
  BUILTIN_PLAYBOOKS,
  getPlaybook,
  playbooksForQueue,
} from "@/features/admin/services/playbooks";
export {
  buildAllViews,
  buildOperationalView,
  buildQueueHealth,
  emptyMetrics,
  slaForQueue,
} from "@/features/admin/services/operational-views";
export {
  canExecuteCommand,
  canReadCommandCenter,
  isReadOnlyOps,
} from "@/features/admin/services/rbac-operations";
