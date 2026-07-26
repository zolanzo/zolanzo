# Eligibility

**Eligibility** answers: can this worker perform this type of work?

**Claim policy** answers: under what conditions may they claim available work?

## Sources (merged)

1. Organization policies (optional)
2. Task Template constraints
3. Campaign `audienceConstraints` (override by id)
4. Campaign scopes: country / language / device

## Worker context

- Country, languages, skills
- Platforms / devices
- Trust score, approval rate, completed tasks
- Organization memberships
- Optional invite token

Hard failures block claims. Soft failures become warnings (ranking later).

Evaluation: `features/task-marketplace/services/eligibility-evaluate.ts`  
Merge: `features/campaigns/services/eligibility.ts`
