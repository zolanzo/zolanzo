import { z } from "zod";

/**
 * Production-grade environment loader.
 * Fail-fast for required variables per stage.
 * Optional ecosystem vars (Passport, Sendchamp) are validated when present — not connected yet.
 */

const appEnvironmentSchema = z.enum([
  "development",
  "preview",
  "staging",
  "production",
]);

const emptyToUndefined = (value: unknown) =>
  value === "" || value === undefined || value === null ? undefined : value;

const optionalUrl = z.preprocess(
  emptyToUndefined,
  z.string().url().optional(),
);

const optionalNonEmpty = z.preprocess(
  emptyToUndefined,
  z.string().min(1).optional(),
);

const optionalSecret32 = z.preprocess(
  emptyToUndefined,
  z.string().min(32).optional(),
);

/**
 * Full environment schema (shape). Stage-specific required keys enforced after parse.
 */
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  ZOLANZO_ENV: appEnvironmentSchema.default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error", "fatal"])
    .optional(),

  // Database
  DATABASE_URL: optionalUrl,
  DIRECT_URL: optionalUrl,

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalNonEmpty,
  SUPABASE_SERVICE_ROLE_KEY: optionalNonEmpty,

  // Security
  CSRF_SECRET: optionalSecret32,
  WEBHOOK_SIGNING_SECRET: optionalNonEmpty,

  // Cache / rate limit
  RATE_LIMIT_REDIS_URL: optionalUrl,
  REDIS_URL: optionalUrl,

  // Ecosystem — optional, not connected in Sprint 1
  STANKINGS_PASSPORT_URL: optionalUrl,
  STANKINGS_PASSPORT_KEY: optionalNonEmpty,
  SENDCHAMP_API_KEY: optionalNonEmpty,
  SENDCHAMP_SENDER_ID: optionalNonEmpty,

  SKIP_ENV_VALIDATION: z
    .preprocess(emptyToUndefined, z.enum(["1", "true", "yes"]).optional())
    .optional(),
});

export type AppEnv = z.infer<typeof envSchema>;
export type AppEnvironmentName = z.infer<typeof appEnvironmentSchema>;

function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
}

function isStrictStage(env: AppEnvironmentName): boolean {
  return env === "production" || env === "staging";
}

function missingStrictKeys(env: AppEnv): string[] {
  const missing: string[] = [];
  if (!env.DATABASE_URL) missing.push("DATABASE_URL");
  if (!env.DIRECT_URL) missing.push("DIRECT_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_URL) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!env.SUPABASE_SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!env.CSRF_SECRET) missing.push("CSRF_SECRET");
  return missing;
}

/** Readiness helper — lists strict keys missing regardless of current stage. */
export function missingStrictKeysForProbe(env: AppEnv = getEnv()): string[] {
  return missingStrictKeys(env);
}

function shouldSkipValidation(raw: NodeJS.ProcessEnv): boolean {
  const skip = raw.SKIP_ENV_VALIDATION;
  return skip === "1" || skip === "true" || skip === "yes";
}

/**
 * Load and validate environment. Throws on invalid / missing required vars.
 */
export function loadEnv(
  raw: NodeJS.ProcessEnv = process.env,
): AppEnv {
  if (shouldSkipValidation(raw)) {
    const parsed = envSchema.safeParse({
      ...raw,
      NEXT_PUBLIC_APP_URL:
        raw.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    });
    if (parsed.success) return parsed.data;
    // Even when skipping, return a minimal development shape if parse fails hard
    return envSchema.parse({
      NODE_ENV: raw.NODE_ENV ?? "development",
      ZOLANZO_ENV: raw.ZOLANZO_ENV ?? "development",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
    });
  }

  const parsed = envSchema.safeParse({
    ...raw,
    NEXT_PUBLIC_APP_URL:
      raw.NEXT_PUBLIC_APP_URL && raw.NEXT_PUBLIC_APP_URL.length > 0
        ? raw.NEXT_PUBLIC_APP_URL
        : "http://localhost:3000",
  });

  if (!parsed.success) {
    throw new Error(`Invalid environment:\n${formatZodError(parsed.error)}`);
  }

  const env = parsed.data;

  if (isStrictStage(env.ZOLANZO_ENV)) {
    const missing = missingStrictKeys(env);
    if (missing.length > 0) {
      throw new Error(
        `Missing required environment variables for ${env.ZOLANZO_ENV}:\n${missing.join("\n")}`,
      );
    }
  }

  return env;
}

let cachedEnv: AppEnv | null = null;

/**
 * Cached env accessor for server runtime.
 */
export function getEnv(): AppEnv {
  if (!cachedEnv) {
    cachedEnv = loadEnv();
  }
  return cachedEnv;
}

/** @internal test helper */
export function resetEnvCache(): void {
  cachedEnv = null;
}

export function getServerEnv(): AppEnv {
  return getEnv();
}

export function getClientEnv(): Pick<
  AppEnv,
  | "NEXT_PUBLIC_APP_URL"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  | "ZOLANZO_ENV"
  | "NODE_ENV"
> {
  const env = getEnv();
  return {
    NEXT_PUBLIC_APP_URL: env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ZOLANZO_ENV: env.ZOLANZO_ENV,
    NODE_ENV: env.NODE_ENV,
  };
}

export function isSupabaseConfigured(env: AppEnv = getEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function isDatabaseConfigured(env: AppEnv = getEnv()): boolean {
  return Boolean(env.DATABASE_URL);
}

export function isServiceRoleConfigured(env: AppEnv = getEnv()): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export type ServerEnv = AppEnv;
export type ClientEnv = ReturnType<typeof getClientEnv>;
