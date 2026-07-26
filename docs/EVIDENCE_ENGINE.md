# Evidence Engine

Evidence kinds live in `EVIDENCE_KINDS` (`constants/work-capabilities.ts`):

`text` · `images` via `image` · `video` · `audio` · `GPS` via `location` · `file` · `link` · `json` · plus `screen_recording`, `logs`, `rating`, `custom`

Templates declare `requiredEvidence[]` and a lightweight `submissionSchema`.

`alignEvidenceRequirements()` ensures required kinds are producible by the capability set (unless `custom`).
