

## Plan: Visa Pending-kunder + Checkout-länk Kopiering

### Sammanfattning
Visa kunder som har fått en checkout-länk men inte registrerat sig ännu (pending). Lägg till en copy-knapp för checkout-länken i tabellen.

---

### Arkitektur

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BEFINTLIGA KUNDER                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Företag          │ Status    │ Månads │ Pris/bild │ Signup │ Checkout     │
├───────────────────┼───────────┼────────┼───────────┼────────┼──────────────┤
│  Joels Bil        │ ✓ Aktiv   │ 500 kr │ 4.50 kr   │ JOE... │ —            │
│  Carcenter Lidkö..│ ⏳ Väntar │ —      │ —         │ CAR... │ [Copy]       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Ändringar (4 delar)

**1. Migration: Lägg till `checkout_url` i signup_codes**
```sql
ALTER TABLE signup_codes ADD COLUMN checkout_url text;
```

**2. create-customer-checkout - Spara checkout_url**
- Efter att Stripe session skapats, uppdatera signup_codes med `checkout_url`

**3. get-admin-customers - Hämta även pending kunder**
- Hämta ALLA signup_codes (inte bara de med stripe_customer_id != pending)
- För pending-koder: Skapa en "pending customer" med checkout_url
- Kombinera med befintliga companies

**4. Admin.tsx - Visa pending-kunder + copy-knapp**
- Uppdatera Customer interface med `status`, `checkout_url`
- Visa status-kolumn (Aktiv/Väntar)
- Visa copy-knapp för checkout_url om den finns

---

### Tekniska detaljer

**Customer interface (uppdaterad):**
```typescript
interface Customer {
  id: string;
  name: string;
  stripe_customer_id: string | null;
  signup_code: string | null;
  checkout_url: string | null;  // NY
  status: 'active' | 'pending'; // NY
  created_at: string;
  monthlyFee: number | null;
  pricePerImage: number | null;
}
```

**get-admin-customers logik:**
```typescript
// 1. Hämta companies (aktiva kunder)
// 2. Hämta signup_codes (alla)
// 3. För pending codes (stripe_customer_id = "pending"):
//    - Skapa customer med status: "pending", checkout_url från signup_codes
// 4. För aktiva codes:
//    - Matcha med companies via stripe_customer_id
// 5. Returnera kombinerad lista
```

---

### Risk-analys

| Aspekt | Risk | Motivering |
|--------|------|------------|
| Betalningsflöde | Ingen | Bara läsning + ny kolumn |
| Checkout | Minimal | En extra UPDATE efter insert |
| Befintliga kunder | Ingen | De visas fortfarande som vanligt |
| Webhook | Ingen | Ingen ändring |
| UI | Låg | Ny kolumn, copy-knapp |

### Fallback-säkerhet
- Om `checkout_url` är null visas ingen copy-knapp
- Pending-kunder har `monthlyFee` och `pricePerImage` som null (visas som "—")
- Befintliga kunder påverkas inte

