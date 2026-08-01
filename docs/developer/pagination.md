# Pagination

Collection endpoints use a uniform cursor-based pagination envelope.

## Query Parameters

- `cursor` (optional string): Opaque cursor for fetching the next page.
- `limit` (optional integer): Maximum items per page (default: 20, max: 100).

## Response Envelope

```json
{
  "data": [
    { "id": "cmp_1" },
    { "id": "cmp_2" }
  ],
  "page": {
    "nextCursor": "cur_987654321",
    "hasMore": true
  },
  "meta": {
    "requestId": "req_12345",
    "apiVersion": "v1"
  }
}
```
