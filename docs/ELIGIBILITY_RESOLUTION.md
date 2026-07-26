# Eligibility Resolution

Campaigns combine eligibility rules from three sources. **Worker filtering is not implemented yet** — this sprint only merges definitions.

## Merge order

1. Organization policies (constraints)
2. Task Template constraints
3. Campaign `audienceConstraints`

Same constraint `id` → later source wins (campaign overrides template overrides org).

## Output

```ts
{
  constraints: TemplateConstraint[];
  sourceById: Record<string, "organization" | "template" | "campaign">;
}
```

Plus country / language / device scopes on the campaign for future marketplace filters.

Implementation: `features/campaigns/services/eligibility.ts`
