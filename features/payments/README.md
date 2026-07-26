# features/payments

## Bounded context
**Finance — Payment Platform (Sprint 12)**

Provider-agnostic funding. Domain never depends on Paystack/Stripe/Flutterwave/Monnify.

```
Payment Intent (PAY-…) → Adapter → Webhook/Verify → Normalized Event → Ledger → Escrow
```

See [docs/PAYMENT_PLATFORM.md](../../docs/PAYMENT_PLATFORM.md).
