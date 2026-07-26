# Domain Events

Source of truth: `constants/events.ts`  
Bus contract: `lib/events/bus.ts` (noop until infra wired)

## Why events

ZOLANZO scales as an OS: verification, escrow, notifications, analytics, and search must not be hardcoded into one request path. Features **publish**; workers **subscribe**.

## Catalog (selected)

### Work lifecycle
| Event | Typical subscribers |
| --- | --- |
| `campaign.created` | analytics, notifications |
| `campaign.published` | marketplace index |
| `task.claimed` | assignment, notifications |
| `submission.created` | verification |
| `submission.approved` | escrow, wallet, rewards, notifications |
| `submission.rejected` | notifications, disputes (optional) |
| `verification.passed` | escrow.release job |

### Money
| Event | Typical subscribers |
| --- | --- |
| `escrow.funded` | analytics |
| `escrow.released` | wallet.credited |
| `wallet.credited` | notifications |
| `withdrawal.completed` | notifications, analytics |
| `payment.succeeded` | escrow.funded |

### Trust
| Event | Typical subscribers |
| --- | --- |
| `kyc.approved` | workers profile unlock |
| `dispute.opened` | support, escrow hold |
| `moderation.action_taken` | users suspend flows |

### Comms
| Event | Typical subscribers |
| --- | --- |
| `notification.sent` | analytics delivery metrics |
| `message.sent` | push fan-out |

## Envelope

```ts
{
  id: string
  name: DomainEventName
  occurredAt: string
  actorId?: string
  organizationId?: string
  correlationId?: string
  causationId?: string
  payload: object
}
```

## Delivery guarantees (target)

| Stage | Guarantee |
| --- | --- |
| Now | No-op bus (architecture) |
| Next | At-least-once via queue + idempotent handlers |
| Scale | Partition by `organizationId` / `campaignId` |

## Naming rules

- `past.tense` noun verb: `submission.approved`
- No UI events here (use analytics product events separately if needed)
- Breaking payload changes → new event version suffix later (`submission.approved.v2`) only if unavoidable
