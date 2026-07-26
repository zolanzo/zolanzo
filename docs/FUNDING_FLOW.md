# Funding Flow

On `payment.succeeded` (after adapter verification):

1. Immutable `PaymentRecord` with verification snapshot  
2. Ledger `payment_capture`  
3. If purpose = campaign funding:  
   - Ledger `campaign_funding`  
   - Ledger `escrow_reserve`  
   - `EscrowSnapshot` ensure  
   - Campaign `reservedBudgetMinor` increment  
4. Payment Intent → `succeeded`

Wallets remain projections. No gateway names in ledger memos beyond metadata.
