# Rate Limits

Rate limiting is enforced per principal on a sliding minute window and daily quota.

## Headers

Every API response returns standard rate limiting headers:

```http
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1700000000
```

When rate limits are exceeded, requests return status `429 RATE_LIMITED` with a `Retry-After` header specifying wait seconds.
