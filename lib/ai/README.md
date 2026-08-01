# AI Intelligence Foundation (`lib/ai`)

Maps Cursor task package `src/ai/` → **`lib/ai/`** (Zolanzo convention: `app` / `features` / `lib`).

```
lib/ai/
  engine/       # invoke, timeouts, retries, rate limit
  providers/    # MockAIProvider, OpenAIProvider (HTTP adapter)
  prompts/      # registry + JSON parser
  embeddings/   # EmbeddingProvider adapters
  ranking/      # RankingEngine + Match pipeline (4.1B)
  fraud/        # FraudDetector + risk pipeline (4.1C)
  review/       # ReviewAssistant + reviewer summaries (4.1D)
  copilot/      # OrganizationCopilot (4.1E) + WorkerCopilot (4.1F)
  knowledge/    # read-only snapshots
  memory/       # ephemeral session memory
  telemetry/    # audit, tokens, cost, metrics
```

**Invariant:** AI is advisory. It never writes business state. Recommendations flow back through existing domain services.

**Match Engine:** `recommendWorkersForCampaign` — top-N workers, never assigns.

**Fraud Engine:** `assessSubmissionRisk` — risk score for reviewers, never enforces.

**Review Assistant:** `assistSubmissionReview` — reviewer summary + recommendation, never decides.

**Org Copilot:** `askOrgCopilot` — answers org questions with permissions + session memory, never acts.

**Worker Copilot:** `askWorkerCopilotService` — guides workers (self-only) with assignment/progress coaches, never acts.
