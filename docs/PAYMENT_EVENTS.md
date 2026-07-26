# Payment Events

Normalized types (provider-agnostic):

| Event | Meaning |
| --- | --- |
| `payment.initiated` | Provider session created |
| `payment.succeeded` | Funds confirmed |
| `payment.failed` | Payment failed |
| `payment.refunded` | Refund recorded (execution later) |
| `payment.chargeback` | Placeholder |

Stored in `payment_events` with idempotency + processed flag.
