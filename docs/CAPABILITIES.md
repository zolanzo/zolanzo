# Capabilities

Atomic verbs that compose into Task Templates. **No hardcoded task types.**

Catalog: `constants/work-capabilities.ts`

## Composition

```
steps[] → composeCapabilitySet() → capabilities + inferred evidence
```

Unknown capabilities fail validation. Duplicate step keys fail validation.

## Examples

| Capability | Typical evidence |
| --- | --- |
| `downloads_app` | image, logs |
| `captures_photo` | image |
| `captures_gps` | location |
| `labels_image` | json, image |
| `custom_capability` | custom / text / file |

Sprint 2 expanded the catalog with aliases such as `captures_photo`, `submits_rating`, `follows_account`, `calls_phone`, `custom_capability`.

## Rule

New workflows = new **templates** (and rarely new capabilities). Never fork the kernel.
