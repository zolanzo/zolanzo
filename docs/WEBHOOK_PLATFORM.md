# Webhook Platform

Webhooks are infrastructure.

1. Route receives raw headers + body  
2. Adapter verifies signature interface + parses payload  
3. Adapter emits `NormalizedPaymentEvent[]`  
4. Platform ingests with **idempotency keys**  
5. Domain funding runs only for `payment.succeeded`

Replay protection: unique `idempotencyKey` on `PaymentEvent` (duplicate → no-op).
