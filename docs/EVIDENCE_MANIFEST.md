# Evidence Manifest

Every Submission Package has one Evidence Manifest describing all evidence.

| Kind | Typical use |
| --- | --- |
| `image` | Screenshots, photos |
| `video` | Walkthroughs |
| `audio` | Voice samples |
| `file` | PDFs / binaries |
| `gps` | Coordinates (inline) |
| `json` | Metrics payloads (inline) |
| `link` | External URLs (inline) |
| `text` | Worker explanations (inline) |
| `screen_recording` | Screen captures |

Each item stores:

- `kind`, `label`, optional `stepKey`
- `reference` (`EvidenceReference`: adapter + container + objectKey)
- `contentHash`, `sizeBytes`
- optional `inlinePayload` for text/json/gps/link

Mutable only while submission is `draft` or `ready`. Finalized on submit.
