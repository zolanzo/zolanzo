# SDK Downloads

Generate typed client SDKs directly from the OpenAPI 3.1 specification.

## Supported Client Bundles

- **TypeScript SDK**: Full TypeScript types and HTTP client wrapper
- **Node.js SDK**: CommonJS/ESM module client
- **REST & cURL Examples**: Executable command-line snippets

## Generating SDKs

Call the SDK generation API:

```http
POST /api/v1/developer/sdk/generate
```

Or trigger generation via `SDKGenerator.generate()`.
