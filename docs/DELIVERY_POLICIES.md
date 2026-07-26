# Delivery Policies

Policies decide *when* a job should run. Preferences can further defer (quiet hours / DND).

## Modes

| Mode | Behavior |
| --- | --- |
| `immediate` | Schedule now |
| `delayed` | `now + delaySeconds` |
| `scheduled` | Absolute `scheduledAt` |
| `retry` | Retry metadata; used on failure |
| `quiet_hours` | Defer if inside quiet window |
| `batch` | Delay by batch window |
| `digest` | Future-ready; marks `digestDeferred` |

## Quiet hours & DND

Windows use `HH:mm` in the preference timezone. Overnight windows (e.g. `22:00`–`07:00`) are supported.

Evaluation order:

1. Policy mode base schedule
2. Policy quiet hours
3. Preference DND windows

## Retry

Exponential-style backoff: `backoffSeconds * attempts`. Jobs fail when `attempts >= maxAttempts`.

## Seeded policies

Migration seeds:

- `immediate`
- `delayed_5m`
- `quiet_hours_default`
- `digest_daily` (future)
