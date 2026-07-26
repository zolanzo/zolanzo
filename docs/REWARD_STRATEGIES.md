# Reward Strategies

Kinds: `fixed` · `per_unit` · `tiered` · `milestone` · `dynamic_future`

Validated by `validateRewardStrategy()` / Zod discriminated union.

Amounts are integer **minor units** + ISO-like currency codes (e.g. `NGN`).  
Escrow / wallet settlement consumes these definitions in Sprint 8 — not here.
