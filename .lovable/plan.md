

## Fix: Visa kunder som betalat men inte registrerat sig

### Problem
`get-admin-customers` hanterar bara två tillstånd:
1. **Aktiv** = finns i `companies`-tabellen
2. **Pending** = finns i `signup_codes` med `stripe_customer_id = "pending"`

Aram Carcenter har betalat (stripe_customer_id = `cus_TvibGYdOz13dJV`), men ingen har registrerat sig med koden annu (`used_at = NULL`). Darfor syns de inte.

### Losning
Lagga till ett tredje tillstand i edge-funktionen: **"Betald men ej registrerad"** — koder dar `stripe_customer_id` INTE ar "pending" OCH `used_at` ar NULL.

### Andringar (1 fil)

**`supabase/functions/get-admin-customers/index.ts`**

Andring i loopen som sorterar signup_codes (rad 63-78):

```text
Nuvarande logik:
  "pending"        -> pendingCodes (visas som Vantar)
  har stripe ID    -> codeMap (matchas mot companies)

Ny logik:
  "pending"                          -> pendingCodes (visas som Vantar)
  har stripe ID + used_at != null    -> codeMap (matchas mot companies)
  har stripe ID + used_at == null    -> paidPendingCodes (ny lista, visas som Vantar)
```

De "betalda men ej registrerade" kunderna laggs till i `pendingCustomers`-listan med status `"pending"` och sin `checkout_url`, precis som vanliga pending-kunder, men med sitt riktiga `stripe_customer_id` sa att admin kan se att betalningen gatt igenom.

### Teknisk detalj

Uppdatera SELECT-queryn for signup_codes att aven inkludera `used_at`:

```typescript
.select("stripe_customer_id, code, company_name, created_at, checkout_url, used_at")
```

Lagg till en ny array `paidPendingCodes` for koder dar `stripe_customer_id !== "pending"` och `used_at === null`, och inkludera dem i pending-listan.

### Risk
- **Ingen risk** for befintliga kunder — aktiva kunder fran `companies` visas som vanligt
- **Ingen risk** for betalningsflode — bara lasning av data
- Enda andringen ar i en edge-funktion som lagger till ett extra villkor i en loop
