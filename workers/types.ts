/**
 * Expand worker type contracts for multi-queue processing.
 */

export type WorkerJob<TPayload = unknown> = {
  id: string;
  name: string;
  queue: string;
  payload: TPayload;
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  availableAt?: string;
};

export type WorkerHandler<TPayload = unknown> = (
  job: WorkerJob<TPayload>,
) => Promise<void>;

export type WorkerRegistration = {
  name: string;
  queue: string;
  handler: WorkerHandler;
  concurrency?: number;
};
