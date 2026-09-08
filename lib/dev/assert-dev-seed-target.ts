/**
 * Abort development seeds unless every configured DB/Auth target is zolanzo-dev.
 * Never rely on a single visible shell variable.
 */

export const ZOLANZO_DEV_PROJECT_REF = "uufeisrkxleacwivtjzv";
export const ZOLANZO_PRODUCTION_PROJECT_REF = "ffvwviabpyhjeoxjxunb";

const TARGET_ENV_KEYS = [
  "DATABASE_URL",
  "DIRECT_URL",
  "POSTGRES_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL_NON_POOLING",
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_PROJECT_REF",
] as const;

export function collectDatabaseTargetStrings(
  env: NodeJS.Dict<string | undefined>,
): string[] {
  return TARGET_ENV_KEYS.map((key) => env[key])
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());
}

export function assertDevelopmentSeedTarget(
  env: NodeJS.Dict<string | undefined> = process.env,
): void {
  if (env.ZOLANZO_ENV !== "development") {
    throw new Error(
      `Abort seed: ZOLANZO_ENV must be development (got ${env.ZOLANZO_ENV ?? "unset"}).`,
    );
  }

  const targets = collectDatabaseTargetStrings(env);
  if (targets.length === 0) {
    throw new Error(
      "Abort seed: no database/Supabase connection targets found in the environment.",
    );
  }

  const joined = targets.join("\n").toLowerCase();
  if (joined.includes(ZOLANZO_PRODUCTION_PROJECT_REF)) {
    throw new Error(
      "Abort seed: production project ref ffvwviabpyhjeoxjxunb appeared in a connection target.",
    );
  }

  const missingDev = targets.filter(
    (value) => !value.toLowerCase().includes(ZOLANZO_DEV_PROJECT_REF),
  );
  if (missingDev.length > 0) {
    throw new Error(
      "Abort seed: every connection target must include development ref uufeisrkxleacwivtjzv.",
    );
  }
}
