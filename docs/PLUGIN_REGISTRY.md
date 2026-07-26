# Plugin Registry

Plugins register with metadata:

- key / display name / version
- capabilities
- supported entity types
- supported extension points
- priority
- health (`healthy` | `stub` | …)
- configuration schema

## Selection

```ts
selectAiPlugin({
  requiredCapabilities: ["reviewer_assistance"],
  extensionPoint: "review",
  entityType: "review_queue_item",
})
```

`preferLive: true` selects the Memory plugin for local/test execution.

## Built-ins

| Key | Live? |
| --- | --- |
| memory | **yes** |
| evidence_quality | stub |
| fraud_detection | stub |
| duplicate_detection | stub |
| risk_scoring | stub |
| reviewer_assistance | stub |
| queue_routing | stub |
| moderation_assistance | stub |
| translation_assistance | stub |
| prompt_generation | stub |
