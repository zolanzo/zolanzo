# Frequently Asked Questions (FAQ)

Common questions regarding ZOLANZO developer integrations.

## 1. Do webhooks retry failed deliveries?
Yes. Webhooks use an exponential backoff retry strategy (`maxAttempts: 5`, max backoff 60s).

## 2. Can I call internal services directly?
No. All integrations must interact exclusively through `/api/v1` routes and signed Webhook v1 subscriptions.

## 3. How are API keys stored?
API keys are hashed using SHA-256 at rest. Secrets are displayed only once upon key creation or rotation.
