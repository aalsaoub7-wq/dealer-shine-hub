

## Plan: Riktig Bindningstid med Blockerad Avbokning i Stripe

### Så här fungerar det

Stripe stödjer **dynamiska portal-konfigurationer** där du kan blockera avbokningsmöjligheten helt under bindningstiden. När kunden försöker gå till Customer Portal så kontrollerar vi om bindningstiden fortfarande är aktiv - om ja, visar vi en portal UTAN avbokningsknapp.

---

### Arkitektur

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                              SKAPA KUND (Admin)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Företagsnamn: [________]   Månadsavgift: [____]   Pris/bild: [____]       │
│                                                                             │
│  Inkluderade bilder: [____]   Bindningstid (månader): [____]               │
│                                0 = ingen bindning                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         create-customer-checkout                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. Beräkna binding_end_date = today + X månader                           │
│  2. Spara i subscription metadata:                                          │
│     - binding_months: "12"                                                  │
│     - binding_end_date: "2027-02-03"                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           KUND ÖPPNAR PORTAL                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  customer-portal edge function:                                             │
│                                                                             │
│  1. Hämta kundens subscription                                              │
│  2. Kolla metadata.binding_end_date                                         │
│  3. Om binding_end_date > idag:                                             │
│     → Skapa portal session med configuration som BLOCKERAR avbokning       │
│  4. Om binding_end_date <= idag eller inte finns:                           │
│     → Skapa portal session med vanlig configuration (kan avboka)           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Ändringar (3 filer)

**1. Admin.tsx - Nytt input-fält**
- Lägg till `bindingMonths` state (standard: 0)
- Lägg till input-fält i formuläret
- Skicka med i API-anropet

**2. create-customer-checkout/index.ts - Spara bindningstid**
- Ta emot `bindingMonths` parameter
- Beräkna `binding_end_date`
- Spara i `subscription_data.metadata`

**3. customer-portal/index.ts - Dynamisk avbokningsblockering**
- Hämta kundens aktiva subscription
- Läs `binding_end_date` från metadata
- Skapa portal configuration dynamiskt:
  - Om inom bindningstid → `subscription_cancel: { enabled: false }`
  - Om bindningstid passerad → `subscription_cancel: { enabled: true }`

---

### Stripe Portal Configuration

Vi skapar en **dynamisk konfiguration vid varje portal-session**:

```typescript
// customer-portal/index.ts

// 1. Hämta subscription och kolla bindningstid
const subscriptions = await stripe.subscriptions.list({
  customer: customerId,
  status: 'active',
  limit: 1
});

let canCancel = true; // Default: kan avboka

if (subscriptions.data.length > 0) {
  const sub = subscriptions.data[0];
  const bindingEndDate = sub.metadata?.binding_end_date;
  
  if (bindingEndDate) {
    const endDate = new Date(bindingEndDate);
    canCancel = endDate <= new Date(); // Kan bara avboka om bindningstiden gått ut
  }
}

// 2. Skapa dynamisk portal-konfiguration
const portalConfig = await stripe.billingPortal.configurations.create({
  features: {
    subscription_cancel: {
      enabled: canCancel,
      mode: 'at_period_end'
    },
    payment_method_update: { enabled: true },
    invoice_history: { enabled: true }
  },
  business_profile: {
    headline: canCancel 
      ? 'Hantera din prenumeration' 
      : `Bindningstid t.o.m. ${bindingEndDate}`
  }
});

// 3. Skapa portal session med denna konfiguration
const portalSession = await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: returnUrl,
  configuration: portalConfig.id
});
```

---

### Vad kunden ser

**Under bindningstid:**
- Portalen visar "Bindningstid t.o.m. 2027-02-03" som headline
- Ingen "Avsluta prenumeration" knapp visas
- Kan fortfarande uppdatera betalningsmetod och se fakturor

**Efter bindningstid:**
- Normal portal med avbokningsmöjlighet

---

### Risk-analys

| Aspekt | Risk | Motivering |
|--------|------|------------|
| Betalningsflöde | Ingen | Metadata påverkar inte betalningar |
| Checkout | Ingen | Bara extra metadata läggs till |
| Befintliga kunder | Ingen | De får `canCancel = true` (ingen metadata) |
| Portal för nya kunder | Låg | Ny logik, men fallback till vanlig portal |
| Webhook | Ingen | Inga ändringar |

### Fallback-säkerhet
Om något går fel i den nya logiken faller vi tillbaka på en vanlig portal där kunden kan avboka. Detta är säkrare än att blockera åtkomst helt.

---

### Sammanfattning

- **Admin anger bindningstid i månader** vid kundskapande
- **Stripe lagrar slutdatum i metadata** på subscription
- **Portal kontrollerar dynamiskt** om avbokning ska vara möjlig
- **Befintliga kunder påverkas inte** (ingen metadata = kan avboka)

