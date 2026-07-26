# Task Template System

## Idea

A **Task Template** describes HOW work is done as an ordered list of **Work Capabilities**.

```
TaskTemplate
  └── steps[]: { key, capability, instruction, required, configSchemaKey? }
```

Campaigns pick a template. Generating 50,000 app-download units does **not** invent a new product — it multiplies Tasks from one template.

## Capabilities vs templates vs campaign types

| Concept | Responsibility |
| --- | --- |
| Work Capability | Atomic verb (`downloads_app`, `captures_gps`) |
| Task Template | Composition + default validation/review |
| Campaign Type | Catalog/category + platform requirements (KYC, escrow) |

## Examples

### Google Play App Test
`downloads_app` → `opens_app` → `creates_account` → `runs_test` → `captures_screenshot` → `submits_text` → `captures_device_info`

### Property Verification
`captures_gps` → `verifies_location` → `uploads_photo` → `uploads_video` → `submits_text`

### Social follow (Instagram / LinkedIn / …)
Same capabilities (`opens_url`, `follows_profile`, `captures_screenshot`) — different step config (URL, network). **No new engine.**

## Registry

- Definitions: `constants/task-templates.ts`
- Dynamic registration: `registerTaskTemplate()`
- Evidence inference: `templateEvidenceKinds()`

Built-ins include: Instagram Follow, Google Play App Test, Android Bug Hunt, Website Signup, Image Annotation, Voice Recording, Translation, Research, Property/Vehicle Verification, Survey, Mystery Shopping, Lead Calling, Website Testing, Custom Human Task.

## Expansion rule

New industry / network / workflow:

1. Reuse existing capabilities when possible  
2. Add a capability only if truly new atomic behavior  
3. Register a template  
4. Optionally map a campaign type  

**Zero kernel changes.**

## Feature module

`features/task-templates` — future admin/studio UI for composing templates (not built in Step 5).
