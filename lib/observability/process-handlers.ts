/**
 * Process-level unhandled rejection / exception capture.
 * Idempotent — safe to call once from instrumentation.
 */

import { captureException } from "@/lib/integrations/monitoring";
import { logUnhandledError } from "@/lib/observability/logger";
import { incrementCounter } from "@/lib/observability/metrics";

let installed = false;

export function installProcessErrorHandlers(): void {
  if (installed) return;
  installed = true;

  process.on("unhandledRejection", (reason) => {
    incrementCounter("process.unhandled_rejection");
    logUnhandledError(reason, {
      module: "process",
      errorCode: "UNHANDLED_REJECTION",
    });
    void captureException(reason, {
      message: "Unhandled promise rejection",
      tags: { source: "unhandledRejection" },
    });
  });

  process.on("uncaughtException", (error) => {
    incrementCounter("process.uncaught_exception");
    logUnhandledError(error, {
      module: "process",
      errorCode: "UNCAUGHT_EXCEPTION",
    });
    void captureException(error, {
      message: "Uncaught exception",
      tags: { source: "uncaughtException" },
    });
  });
}
