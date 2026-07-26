# Dependency Registry

Central in-memory registry: `lib/reliability/dependency-registry.ts`.

## Record shape

```ts
{
  id: DependencyId,
  status: "healthy" | "degraded" | "unavailable",
  latencyMs: number | null,
  lastSuccessAt: string | null,
  lastFailureAt: string | null,
  detail?: string,
  metadata?: Record<string, unknown>
}
```

## IDs

`database` · `supabase_auth` · `storage` · `redis` · `queue` · `scheduler` · `environment`

## Updates

Readiness probes call `dependencyRegistry.report(...)` on every check.  
Cron runner updates `scheduler` on start / tick / stop / shutdown.

## Scope

Process-local (not shared across instances). Sufficient for per-instance readiness until a shared control plane is added.
