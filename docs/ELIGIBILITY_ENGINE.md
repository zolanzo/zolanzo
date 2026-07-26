# Eligibility Engine

Structured checks (not a boolean-only gate):

- Available / reserved / withdrawable balance
- Min / max amount
- Minimum residual balance
- Cooling period
- Destination kind + verification
- Outstanding reviews
- Account verification (placeholder levels)
- Pending settlements (informational)

Returns `{ eligible, checks[], withdrawableMinor, … }`.

Implemented in `features/withdrawals/services/eligibility.ts`.
