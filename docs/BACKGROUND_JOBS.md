# Background Jobs

Async work is mandatory for scale. Sync request path stays thin.

## Queues

| Queue | Purpose |
| --- | --- |
| `critical` | Event fanout that must not lag |
| `default` | Campaign task gen, validation, analytics |
| `comms` | Email, SMS, push, digests, webhooks |
| `media` | Image/video/audio + virus scan |
| `finance` | Escrow, withdrawals, settlements, reconcile |
| `ai` | AI validation assists |
| `search` | Index / reindex |
| `cleanup` | Temp uploads, expired sessions |

Routing: `JOB_QUEUE_ROUTING` in `jobs/names.ts`

## Job catalog

| Domain | Jobs |
| --- | --- |
| Media | convert WebP, process video/audio, virus scan |
| Comms | transactional email, SMS, push, digest, dispatch, webhook deliver |
| Work | generate tasks, index marketplace, validation, verification, AI validation, expire assignments |
| Finance | escrow release, withdrawals, settlement batch, referral payout, daily reconcile |
| Platform | analytics snapshot, reports, search reindex, event fanout, cleanup |

## Cron schedules

UTC schedules in `jobs/schedules.ts`:

- Daily reconcile `02:00`
- Notification digests `08:00`
- Assignment expire every 5m
- Temp upload cleanup hourly
- Session cleanup nightly
- Analytics hourly
- Settlement batches weekdays 10:00 / 16:00

## Reliability rules

1. **Idempotent handlers** — safe retries  
2. **Max attempts + dead letter**  
3. **Backoff** — exponential for providers  
4. **Finance jobs** — never double-post ledger (use idempotency keys)  
5. **No secrets in payloads** — store refs, not tokens  

## Worker process model

- App servers enqueue; dedicated worker processes consume  
- Concurrency per queue configurable (`WorkerRegistration`)  
- Horizontal scale by adding workers; finance queue may pin lower concurrency  

## Phase 2 implementation note

Handlers live under `workers/` / `jobs/` when wired. Step 7 only defines names, queues, and schedules.  
