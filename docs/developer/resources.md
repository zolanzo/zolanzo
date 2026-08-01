# Public Resources

The ZOLANZO Public API exposes stable resources derived directly from the OpenAPI 3.1 specification.

## Core Tagged Resources

- **Identity**: `/me`, `/oauth/token`
- **Organizations**: `/organizations`, `/organizations/{id}`
- **Workers**: `/workers`, `/workers/{id}`
- **Campaigns**: `/campaigns`, `/campaigns/{id}`
- **Assignments**: `/assignments`, `/assignments/{id}`, `/assignments/{id}/claim`
- **Reviews**: `/reviews/{id}/status`
- **Payments**: `/payments/{id}/status`, `/settlements/{id}/status`
- **Trust**: `/trust/{principalId}/profile`, `/trust/{principalId}/passport`, `/trust/{principalId}/badges`
- **Analytics**: `/analytics/dashboards`, `/analytics/reports`, `/analytics/snapshots`, `/analytics/aggregates`
- **Forecasts**: `/forecasts/campaign`, `/forecasts/finance`, `/forecasts/trust`, `/forecasts/organization`
- **Reports**: `/reports`, `/reports/generate`, `/reports/{id}/download`, `/reports/schedule`
- **Automation**: `/automation/rules`, `/automation/rules/draft`, `/automation/rules/{id}/submit`, `/automation/rules/{id}/publish`, `/automation/rules/simulate`
