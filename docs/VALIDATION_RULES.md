# Validation Rules

Modes (`VALIDATION_MODES`): `automatic` · `ai` · `manual` · `hybrid` · `rule_based`

Template field `validationRules`:

```ts
{ mode, ruleKeys[], aiAssist?, autoApproveIf?, rejectIf? }
```

`rule_based` requires at least one `ruleKeys` entry.  
Runtime evaluation: Validation Engine Rule Validator (`features/verification`) against profile `ruleKeys`.
