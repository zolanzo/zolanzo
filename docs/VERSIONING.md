# Template Versioning

| Status | Editable? | Notes |
| --- | --- | --- |
| `draft` | Yes | Working copy |
| `published` | No | Immutable; campaigns will pin a version |
| `archived` | No | Historical |

Publishing sets `publishedAt`.  
Editing a published template → `createNewTemplateVersion()` → new draft with incremented `version` and new `TPL-…` public ID, linked via `previousVersionId`.

Helpers: `features/task-templates/services/versioning.ts`
