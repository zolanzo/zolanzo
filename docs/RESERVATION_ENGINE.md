# Reservation Engine

Temporary hold preventing double-claims.

## States

`pending` → `converted` | `expired` | `released`

## Behavior

- Default timeout: **120 seconds** (campaign override via `reservationTimeoutSeconds`)
- Atomic `updateMany` where `status=available` ensures one winner under concurrency
- On expiry/release: Task Instance returns to `available`
- On confirm: Reservation `converted`, Task Instance `claimed`, Assignment created

Marketplace never lists reserved rows.

Implementation: `features/task-marketplace/services/reservation-engine.ts`
