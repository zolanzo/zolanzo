# Validation Profiles

Profiles select which validators are active. Validators remain reusable.

| Key | Use |
| --- | --- |
| `app_testing` | Screenshots / recordings / full core set |
| `survey` | Text-heavy; no GPS/file validators |
| `ai_labeling` | JSON/label payloads |
| `property_verification` | GPS + image + device |
| `voice_recording` | Audio + timing |
| `translation` | Text deliverables |

Catalog: `constants/validation-profiles.ts`  
DB seed: `validation_profiles` (audit / admin lookup)

Resolve order: explicit `profileKey` → submission metadata → default `app_testing`.
