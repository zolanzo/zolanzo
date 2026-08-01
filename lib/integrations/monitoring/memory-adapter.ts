/**
 * In-memory monitoring adapter — tests + local capture buffer.
 */

import type {
  MonitoringEvent,
  MonitoringProviderAdapter,
} from "@/lib/integrations/monitoring/types";

const buffer: MonitoringEvent[] = [];
const MAX = 200;

export const memoryMonitoringAdapter: MonitoringProviderAdapter = {
  providerKey: "memory",
  capabilities: ["error_tracking"],

  async captureException(event) {
    push(event);
    return { accepted: true, id: `mem_${buffer.length}` };
  },

  async captureMessage(event) {
    push(event);
    return { accepted: true, id: `mem_${buffer.length}` };
  },

  async flush() {
    // no-op
  },
};

function push(event: MonitoringEvent): void {
  buffer.push(event);
  if (buffer.length > MAX) buffer.shift();
}

export function listCapturedMonitoringEvents(): readonly MonitoringEvent[] {
  return buffer;
}

export function clearCapturedMonitoringEvents(): void {
  buffer.length = 0;
}
