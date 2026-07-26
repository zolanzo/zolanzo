# Payment Adapters

All gateways implement `PaymentProviderAdapter`:

- `createPaymentIntent`
- `verifyPayment`
- `parseWebhook`
- `normalizeEvent`
- `refundPayment` (placeholder)
- `createTransfer` (placeholder)
- `getTransaction` (optional)

## Built-in stubs (no live API)

| Provider | Notable capabilities |
| --- | --- |
| `memory` | Local/tests |
| `paystack` | Virtual accounts, payouts |
| `flutterwave` | Multi-currency payouts |
| `stripe` | Recurring, split payments |
| `monnify` | Virtual accounts |

Selection uses **Provider Capabilities**, not hardcoded provider names in domain logic.
