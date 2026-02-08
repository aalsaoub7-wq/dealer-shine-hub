

# Fix: "Konto ej aktiverat" ska ALDRIG visas for betalande kunder

## Problemanalys

Jag hittade **4 scenarion** dar en betalande kund KAN se "Konto ej aktiverat":

### Problem 1: Kunder KAN registrera sig FORE betalning

`public_signup_codes`-vyn filtrerar INTE bort koder dar `stripe_customer_id = 'pending'`. Det innebar att en kund kan anvanda sin signup-kod och skapa ett konto innan de betalat. Foretaget skapas med `stripe_customer_id = 'pending'`, och nar de sedan betalar uppdateras bara `signup_codes`-tabellen -- INTE `companies`-tabellen. Resultatet: kunden sitter permanent fast bakom paywallen.

Exempel fran databasen: "Carcenter Lidkoping AB" har `stripe_customer_id = 'pending'` och `used_at = null` -- de kan registrera sig nu utan att ha betalat.

**Fix:** Uppdatera `public_signup_codes`-vyn och triggern for att blockera koder med `stripe_customer_id = 'pending'`.

---

### Problem 2: Aram Carcenter har INGEN lokal prenumerationspost

`customer.subscription.created`-webhooken fires nar kunden betalar, men foretaget existerar inte i databasen an (kunden har inte registrerat sig). Webhooken misslyckas tyst: "Could not find company for customer: cus_xxx".

Resultat: Aram Carcenter har idag INGEN rad i `subscriptions`-tabellen. `hasActiveSubscription` ar darfor alltid `false` for dem. De klarar sig BARA for att `hasPaymentMethod = true` -- men om det API-anropet till Stripe misslyckas (natverksproblem, rate limit) sa visas paywallen.

**Fix:** Lagg till subscription self-healing i `get-billing-info`: om Stripe har en aktiv prenumeration men databasen saknar post, skapa den automatiskt. Anvand ocksa Stripe-resultatet for att satta `hasActiveSubscription = true`.

---

### Problem 3: `hasActiveSubscription` ignorerar Stripe-fallback

`get-billing-info` gor redan en Stripe-fallback (rad 220-235) som hittar aktiva prenumerationer. Men resultatet anvands BARA for prissattning -- `hasActiveSubscription` pa rad 260 kollar fortfarande BARA den lokala databasen.

Aven om Stripe bekraftar att kunden har en aktiv prenumeration, returnerar funktionen `hasActiveSubscription: false`.

**Fix:** Uppdatera `hasActiveSubscription` att ocksa vara `true` om Stripe-fallback hittar en aktiv prenumeration.

---

### Problem 4: Natverksfel = omedelbar paywall

I `ProtectedRoute.tsx` rad 57-59:
```
if (error) {
  return { showPaywall: true, paymentFailed: false };
}
```

Om `get-billing-info` failar (nere, timeout, natverksfel) visas paywallen omedelbart. En betalande kund forlorar sin atkomst vid ett tillfalsigt serverproblem.

**Fix:** Lagg till retry-logik for tillfaltiga fel. Visa ett generiskt felmeddelande ("Nagonting gick fel, forsok igen") istallet for "Konto ej aktiverat".

---

## Tekniska andringar

### 1. Databasmigration

Uppdatera `public_signup_codes`-vyn att filtrera bort pending-koder OCH uppdatera triggern:

```sql
-- Uppdatera vyn sa att pending-koder inte syns
CREATE OR REPLACE VIEW public.public_signup_codes AS
SELECT id, code, used_at IS NOT NULL as is_used, company_name
FROM public.signup_codes
WHERE stripe_customer_id != 'pending';

-- Uppdatera triggern: blockera registrering om stripe_customer_id = 'pending'
-- (lagg till AND stripe_customer_id != 'pending' i SELECT-queryn)
```

### 2. `supabase/functions/get-billing-info/index.ts`

- Efter Stripe-fallback (rad 220-235): om en aktiv prenumeration hittas, skapa den lokalt (subscription self-healing)
- Uppdatera `hasActiveSubscription` att aven vara `true` om Stripe bekraftar aktiv prenumeration

```text
// Nuvarande (rad 260):
const hasActiveSubscription = !!(subscription && ["active", "trialing"].includes(subscription.status));

// Ny logik:
let hasActiveSubscription = !!(subscription && ["active", "trialing"].includes(subscription.status));

// Om Stripe-fallback hittade en aktiv sub men DB saknar: skapa lokal post + satt flaggan
if (!hasActiveSubscription && stripeSubscriptionId && company.stripe_customer_id) {
  // Hamta full subscription fran Stripe
  const stripeSub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  if (stripeSub.status === 'active' || stripeSub.status === 'trialing') {
    // Self-heal: skapa lokal post
    await supabaseClient.from("subscriptions").upsert({
      company_id: company.id,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_customer_id: company.stripe_customer_id,
      status: stripeSub.status,
      current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    }, { onConflict: 'stripe_subscription_id' });
    
    hasActiveSubscription = true;
  }
}
```

### 3. `src/components/ProtectedRoute.tsx`

- Lagg till retry-logik (max 2 forsok) vid natverksfel
- Skilj pa "inget foretag" (visar paywall) och "backend-fel" (visar felmeddelande med "Forsok igen"-knapp)

```text
// Nuvarande:
if (error) {
  return { showPaywall: true, paymentFailed: false };
}

// Ny logik med retry:
const checkTrialAndPayment = async (retryCount = 0): Promise<...> => {
  const { data, error } = await supabase.functions.invoke("get-billing-info");
  
  if (error) {
    if (retryCount < 2) {
      await new Promise(r => setTimeout(r, 1500));
      return checkTrialAndPayment(retryCount + 1);
    }
    // Efter 2 retries: visa ett generiskt felmeddelande, INTE paywall
    return { showPaywall: false, paymentFailed: false, connectionError: true };
  }
  // ...
};
```

### 4. `supabase/functions/stripe-webhook/index.ts`

I `checkout.session.completed`:
- Efter att signup-koden uppdateras, forska aven skapa subscription-posten direkt (eftersom foretaget inte existerar an, lagra det temporart sa att self-healing i `get-billing-info` kan anvanda det)

### 5. Ny komponent: `ConnectionErrorScreen`

Enkel felskarm som visas vid temporara anslutningsfel istallet for paywall. Visar "Nagonting gick fel" med en "Forsok igen"-knapp.

---

## Sammanfattning

| Problem | Risk | Fix |
|---------|------|-----|
| Pending-koder inte filtrerade i vy/trigger | Permanent paywall | Filtrera bort `stripe_customer_id = 'pending'` |
| Ingen lokal prenumerationspost | Paywall vid Stripe API-fel | Subscription self-healing i `get-billing-info` |
| `hasActiveSubscription` ignorerar Stripe | Felaktig status | Satt flaggan baserat pa Stripe-resultat |
| Natverksfel = omedelbar paywall | Tillfalsig utlasning | Retry-logik + felskarm istallet for paywall |

