# Idempotency

Mutating endpoints (`POST`, `PUT`, `PATCH`, `DELETE`) require an `Idempotency-Key` header.

## Header Usage

```http
Idempotency-Key: ik_9988776655
```

If a request with the same idempotency key is retried, ZOLANZO replays the cached response without re-executing the underlying operation, preventing duplicate actions.
