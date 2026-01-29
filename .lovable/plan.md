

## Plan: Ta bort hårdkodade planer och fixa korrekt prissättning

### Problemet
**ALLA kunder har custom-avtal** men koden har hårdkodade "start/pro/elit" planer som orsakar fel prissättning:
- Joels Bil har 500 kr/mån + 5 kr/bild i Stripe
- Koden använder hårdkodad `start`-plan (5.95 kr/bild) → **FEL PRIS**

### Lösningen: 4 huvudsteg

---

### Steg 1: Ta bort PLANS från usageTracking.ts

**Fil:** `src/lib/usageTracking.ts`

Ta bort:
- `PlanType` typ-definition
- Hela `PLANS` objektet (rad 12-64)
- `PRICES` legacy-objekt (rad 67-70)
- `getPlanPricing` funktion (rad 72-74)

Ändra `trackUsage()`:
- Hämta pris dynamiskt från Stripe via edge function istället för hårdkodade planer
- Anropa `get-billing-info` för att få det verkliga priset per bild

---

### Steg 2: Fixa report-usage-to-stripe edge function

**Fil:** `supabase/functions/report-usage-to-stripe/index.ts`

Problem: Hårdkodade priser (5.95/2.95/1.95 kr)

**Lösning:** Använd Stripe Billing Meter Events API istället för invoice items med hårdkodat pris:

1. Hämta meter event name från prenumerationens metered price
2. Skicka meter event med `stripe.billing.meterEvents.create()`
3. Stripe beräknar kostnaden automatiskt baserat på kundens faktiska pris

```
Före: invoiceItems.create({ unit_amount: 595 }) // Fel!
Efter: billing.meterEvents.create({ event_name, payload: { value: "1", stripe_customer_id } })
```

---

### Steg 3: Städa bort oanvända plan-filer och funktioner

**Filer att ändra/ta bort:**

| Fil | Åtgärd |
|-----|--------|
| `src/components/ChangePlanDialog.tsx` | Ta bort (oanvänd, redan gömd i UI) |
| `src/components/TrialExpiredPaywall.tsx` | Ta bort PLANS-kod (redan kommenterad) |
| `src/components/PaymentSettings.tsx` | Ta bort `PLANS` import |
| `supabase/functions/create-checkout-session/index.ts` | Ta bort (ersatt av create-customer-checkout) |
| `supabase/functions/create-stripe-customer/index.ts` | Ta bort PLAN_PRICES, förenkla |
| `supabase/functions/update-subscription/index.ts` | Ta bort (ingen plan-switching) |
| `supabase/functions/stripe-webhook/index.ts` | Ta bort PLAN_PRICES, scheduled downgrade-logik |
| `supabase/functions/get-billing-info/index.ts` | Ta bort FALLBACK_PLAN_PRICING |

---

### Steg 4: Uppdatera subscriptions-tabellen

Ta bort kolumnen `plan` och relaterade kolumner:
- `plan` (text) - inte längre relevant
- `scheduled_plan` (text) - ingen plan-switching
- `scheduled_plan_date` (timestamp) - ingen plan-switching

---

## Teknisk implementation

### A. Ny trackUsage() logik

```typescript
// src/lib/usageTracking.ts

export const trackUsage = async (type: "edited_image", carId?: string) => {
  // ... existing auth and trial checks ...
  
  // Get dynamic price from Stripe via edge function
  const { data: billingInfo } = await supabase.functions.invoke("get-billing-info");
  const pricePerImage = billingInfo?.planConfig?.pricePerImage || 0;
  
  // Track in usage_stats with actual price
  const newCost = (existingStats?.edited_images_cost || 0) + pricePerImage;
  
  // Report to Stripe meter
  await supabase.functions.invoke("report-usage-to-stripe", {
    body: { quantity: 1 }
  });
};
```

### B. Ny report-usage-to-stripe logik

```typescript
// supabase/functions/report-usage-to-stripe/index.ts

// 1. Get customer's subscription
const subscriptions = await stripe.subscriptions.list({
  customer: company.stripe_customer_id,
  status: "active",
  limit: 1,
});

// 2. Find the metered price's meter
const sub = subscriptions.data[0];
const meteredItem = sub.items.data.find(item => 
  item.price.recurring?.usage_type === 'metered'
);
const meterId = meteredItem.price.recurring.meter;

// 3. Get meter details to find event_name
const meter = await stripe.billing.meters.retrieve(meterId);
const eventName = meter.event_name;

// 4. Create meter event
await stripe.billing.meterEvents.create({
  event_name: eventName,
  payload: {
    value: String(quantity),
    stripe_customer_id: company.stripe_customer_id,
  },
  timestamp: Math.floor(Date.now() / 1000),
});
```

### C. Förenklad get-billing-info

Ta bort `FALLBACK_PLAN_PRICING` och alltid hämta pris från Stripe. Om ingen prenumeration finns → returnera 0 kr (trial).

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/lib/usageTracking.ts` | Ta bort PLANS, hämta pris dynamiskt |
| `supabase/functions/report-usage-to-stripe/index.ts` | Använd Meter Events API |
| `supabase/functions/get-billing-info/index.ts` | Ta bort FALLBACK_PLAN_PRICING |
| `supabase/functions/stripe-webhook/index.ts` | Ta bort plan-logik |
| `src/components/PaymentSettings.tsx` | Ta bort PLANS import |
| `src/components/ChangePlanDialog.tsx` | Ta bort filen |
| `supabase/functions/create-checkout-session/index.ts` | Ta bort filen |
| `supabase/functions/update-subscription/index.ts` | Ta bort filen |
| `supabase/functions/create-stripe-customer/index.ts` | Ta bort PLAN_PRICES |
| `supabase/config.toml` | Ta bort create-checkout-session, update-subscription |

---

## Korrigering för befintlig data

Joels Bil har 46 bilder fakturerade fel (5.95 kr istället för 5 kr):
- Felaktigt: 273.70 kr
- Korrekt: 230 kr
- **Differens: 43.70 kr för mycket**

Detta måste korrigeras manuellt i Stripe via kreditnota eller justering.

