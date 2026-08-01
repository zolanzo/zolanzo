# Webhooks Platform

Receive real-time outbound event notifications when platform events occur.

## Event Payload Envelope

```json
{
  "id": "evt_12345",
  "event": "assignment.completed",
  "occurredAt": "2026-07-31T00:00:00Z",
  "version": "v1",
  "data": {},
  "requestId": "req_12345",
  "deliveryId": "del_67890"
}
```

## Security Headers

- `X-Zolanzo-Event`: Event type (e.g. `assignment.completed`)
- `X-Zolanzo-Timestamp`: ISO timestamp
- `X-Zolanzo-Signature`: HMAC SHA-256 signature (`v1=<hex>`)
- `X-Zolanzo-Delivery`: Unique delivery ID

## Verification Code Example (TypeScript)

```typescript
import crypto from "node:crypto";

function verifySignature(payload: string, signatureHeader: string, secret: string): boolean {
  const expected = "v1=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
}
```
