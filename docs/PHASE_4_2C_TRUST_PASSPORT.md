# Phase 4.2C — Trust Passport

**Status:** Complete  
**Date:** 2026-07-26  
**Prerequisite:** [Phase 4.2B Trust Persistence](./PHASE_4_2B_TRUST_PERSISTENCE.md)

## Mission

Present trust as a **user-facing product** — portable, explainable, and visibility-aware.

- Passport **never calculates** trust
- All scores / trends / reasons come from `TrustProfileService`
- Badges, achievements, guidance, and timeline are **derived presentation**

## Architecture

```text
TrustProfileService
        ↓
PassportBuilder
   ├── BadgeEngine
   ├── AchievementEngine
   ├── GuidanceBuilder
   ├── TimelineBuilder
   └── VisibilityFilter
        ↓
   Trust Passport
```

Package: `lib/trust/passport/`

| Component | Path |
| --- | --- |
| PassportBuilder | `passport-builder.ts` |
| BadgeEngine | `badge-engine.ts` |
| AchievementEngine | `achievement-engine.ts` |
| GuidanceBuilder | `guidance-builder.ts` |
| TimelineBuilder | `timeline-builder.ts` |
| VisibilityFilter | `visibility-filter.ts` |
| PassportService | `passport-service.ts` |

## Passport sections

Identity · Overall trust + trend · Dimension scores + explanations · Achievements · Badges · Guidance · Timeline

## Views

| Visibility | Contents |
| --- | --- |
| **private** | Full details for the owner |
| **organization** | Evaluation view — earned achievements, guidance, timeline; limited warnings |
| **public** | Minimal shareable — score, trend, earned public badges; no guidance/timeline/reasons |

## Badges

Verified Email/Phone/Identity · Trusted Worker · Reliable Contributor · High Approval · Long-Term Member · Zero Fraud · Organization Trusted

## Feature flags

| Flag | Default |
| --- | --- |
| `TRUST_PASSPORT` | on |
| `TRUST_BADGES` | on |
| `TRUST_TIMELINE` | on |

Product flags: `trust.passport`, `trust.badges`, `trust.timeline`

## API

```ts
import { getTrustPassport } from "@/lib/trust/trust-service";

const passport = await getTrustPassport({
  subjectType: "worker",
  subjectId: userId,
  visibility: "organization", // private | organization | public
});
// passport.advisoryOnly === true
// passport.summary.overallScore comes from TrustProfile — not recomputed
```

Match Engine badge metadata:

```ts
import { getPassportBadgeMetadata } from "@/lib/trust/trust-service";
// or sync helper matchBadgeMetadataFromSignals for ranking pools
```

## Consumers

- Worker profile / org worker view (via `getTrustPassport`)
- Worker Copilot / Org Copilot (can surface passport guidance & badges)
- Match Engine (`trustBadges` metadata on candidates)

## Admin

Command Center → **Passport Health**

Passports generated · badge distribution · timeline events · latency · visibility usage · errors

## Tests

`lib/trust/passport/passport.test.ts`

Generation · visibility · badges · timeline order · guidance · flags · telemetry

## Explicit non-goals

- New trust scoring formulas
- QR / share links (future)
- Passport persistence table (built on demand from TrustProfile)

## Next

**Pause AI expansion.** Recommended: **Phase 4.3 — Business Intelligence**.

**4.3A** Analytics Foundation ✅ — see [PHASE_4_3A_ANALYTICS_FOUNDATION.md](./PHASE_4_3A_ANALYTICS_FOUNDATION.md). Next: **4.3B Executive Dashboards**.

## Implementation Report

1. **Features:** Trust Passport + badges/achievements/guidance/timeline + visibility + Passport Health  
2. **Created:** `lib/trust/passport/*`, `features/admin/services/passport-health.ts`, this doc  
3. **Modified:** Command Center, admin page, env, feature flags, Match signals (`trustBadges`), ROADMAP  
4. **Database:** none (reads TrustProfile / TrustEvent / history)  
5. **Routes:** none  
6. **Env:** `TRUST_PASSPORT`, `TRUST_BADGES`, `TRUST_TIMELINE`  
7. **Security:** Public view strips sensitive explanations; org view limited  
8. **Performance:** On-demand build; capped timeline/history loads  
9. **Tests:** `passport.test.ts`  
10. **TODOs:** Worker/org UI surfaces; QR share  
11. **Production readiness:** Presentation API ready; wire UI when product surfaces land  
