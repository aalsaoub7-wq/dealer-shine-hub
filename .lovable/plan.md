

## Plan: Ta bort Carcenter Lidköping från systemet

### Nuläge
- **signup_codes**: En rad med `code: CARCEN-SE34`, `company_name: Carcenter Lidköping AB`, `stripe_customer_id: pending`
- **companies**: Ingen data (de har inte registrerat sig)
- **Stripe**: En pending customer skapades troligen, men utan aktiv prenumeration

### Åtgärd
Köra en enkel DELETE-query mot `signup_codes`:

```sql
DELETE FROM signup_codes 
WHERE code = 'CARCEN-SE34';
```

### Vad som händer
- Raden i `signup_codes` tas bort
- Checkout-länken blir ogiltig (om någon klickar på den fungerar den inte)
- Kunden försvinner från Admin-tabellen "Befintliga kunder"
- Inget annat påverkas

### Risk
**Ingen risk** - detta är bara en pending-rad utan kopplingar till andra tabeller.

