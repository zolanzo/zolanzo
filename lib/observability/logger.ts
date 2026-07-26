/**
 * Structured application logger.
 * Production code must use this — never raw console.log.
 *
 * Automatically merges active RequestContext (correlationId, identities, operation).
 */

import type { LogLevel } from "@/constants/observability";
import { getRequestContext } from "@/lib/observability/request-context";

export type LogFields = Record<string, unknown>;

type Logger = {
  debug: (message: string, fields?: LogFields) => void;
  info: (message: string, fields?: LogFields) => void;
  warn: (message: string, fields?: LogFields) => void;
  error: (message: string, fields?: LogFields) => void;
  fatal: (message: string, fields?: LogFields) => void;
  child: (bindings: LogFields) => Logger;
};

const LEVEL_RANK: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

function resolveMinLevel(): LogLevel {
  const fromEnv = process.env.LOG_LEVEL as LogLevel | undefined;
  if (fromEnv && fromEnv in LEVEL_RANK) return fromEnv;
  return process.env.NODE_ENV === "production" ? "info" : "debug";
}

function contextFields(): LogFields {
  const ctx = getRequestContext();
  if (!ctx) return {};

  const fields: LogFields = {
    correlationId: ctx.correlationId,
  };

  if (ctx.requestId && ctx.requestId !== ctx.correlationId) {
    fields.requestId = ctx.requestId;
  } else if (ctx.requestId) {
    fields.requestId = ctx.requestId;
  }

  if (ctx.organizationId) fields.organizationId = ctx.organizationId;
  if (ctx.userId) fields.userId = ctx.userId;
  if (ctx.workerId) fields.workerId = ctx.workerId;
  if (ctx.clientId) fields.clientId = ctx.clientId;
  if (ctx.operation) fields.operation = ctx.operation;
  if (ctx.jobName) fields.jobName = ctx.jobName;
  if (ctx.module) fields.module = ctx.module;
  if (ctx.isRetry) fields.isRetry = true;
  if (ctx.attempt != null) fields.attempt = ctx.attempt;

  return fields;
}

function write(
  level: LogLevel,
  message: string,
  fields?: LogFields,
  bindings?: LogFields,
): void {
  const min = resolveMinLevel();
  if (LEVEL_RANK[level] < LEVEL_RANK[min]) return;

  const payload = {
    level,
    message,
    ts: new Date().toISOString(),
    service: "zolanzo",
    ...contextFields(),
    ...bindings,
    ...fields,
  };

  const line = `${JSON.stringify(payload)}\n`;
  if (level === "error" || level === "fatal") {
    process.stderr.write(line);
    return;
  }
  process.stdout.write(line);
}

export function createLogger(bindings: LogFields | string = {}): Logger {
  const resolved: LogFields =
    typeof bindings === "string" ? { module: bindings } : bindings;
  return {
    debug: (message, fields) => write("debug", message, fields, resolved),
    info: (message, fields) => write("info", message, fields, resolved),
    warn: (message, fields) => write("warn", message, fields, resolved),
    error: (message, fields) => write("error", message, fields, resolved),
    fatal: (message, fields) => write("fatal", message, fields, resolved),
    child: (childBindings) =>
      createLogger({ ...resolved, ...childBindings }),
  };
}

export const logger: Logger = createLogger();

/**
 * Log an unhandled / unexpected error with standard envelope fields.
 */
export function logUnhandledError(
  error: unknown,
  extras?: LogFields,
): void {
  const err =
    error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : { message: String(error) };

  logger.error("Unhandled error", {
    ...extras,
    err,
    timestamp: new Date().toISOString(),
  });
}
