# Payment Platform

The domain never depends on payment gateways.

```
Client
  → Payment Intent (PAY-…)
  → Provider Adapter (by capabilities)
  → Provider Session (stub/live)
  → Webhook / Verify
  → Normalized Payment Event
  → Ledger + Campaign Funding + Escrow Snapshot
```

Module: `features/payments`  
Adapters: `lib/integrations/payments`
