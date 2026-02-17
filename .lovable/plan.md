

# Fix: Sluta blockera användare när billing-check misslyckas

## Rotorsak

SA BIL verifierade sig korrekt (SMS + e-post). Men nar `get-billing-info` edge function anropades fran `ProtectedRoute`, misslyckades den (troligen ett transient Stripe API-fel eller en race condition med prenumerationsrekordet). Efter 2 retries visade appen `ConnectionErrorScreen` ("Nagot gick fel") -- en permanent blockeringsvagg.

En autentiserad och verifierad kund ska **aldrig** blockeras av ett tillfialligt API-fel. Om billing-checken misslyckas ar det battre att slappa in anvandaren (worst case: en obetald admin far tillfiallig access tills nasta sidladdning lyckas) an att blockera en betalande kund.

## Andring -- 1 fil, 2 rader

**Fil:** `src/components/ProtectedRoute.tsx`

Pa **rad 71** och **rad 110**, andras `connectionError: true` till `connectionError: false`. Detta gor att om alla billing-retries misslyckas, slapps anvandaren in istallet for att blockeras.

### Rad 71 (forsta retry-exhaustion):
```typescript
// FORE:
return { showPaywall: false, paymentFailed: false, connectionError: true };

// EFTER:
return { showPaywall: false, paymentFailed: false, connectionError: false };
```

### Rad 110 (andra retry-exhaustion):
```typescript
// FORE:
return { showPaywall: false, paymentFailed: false, connectionError: true };

// EFTER:
return { showPaywall: false, paymentFailed: false, connectionError: false };
```

## Varfor detta ar sakert

- **Betalande kunder blockeras aldrig** -- om billing-check misslyckas slapps de in
- **Worst case**: en admin utan prenumeration far tillfiallig access tills nasta sidladdning (da billing-checken troligen lyckas och visar paywall)
- **Billing-reconciliation** fangar upp eventuell obetald anvandning automatiskt
- **Alla andra floden forblir identiska** -- paywall, payment-failed, verifiering fungerar precis som innan nar billing-checken lyckas
- Inga backend-andringar, inga edge functions, ingen databas

## Vad andras INTE

- Ingen edge function (get-billing-info, get-verification-status, etc.)
- Ingen databas eller schema
- Inga andra komponenter (Dashboard, CarDetail, Auth, Verify, etc.)
- ConnectionErrorScreen-komponenten finns kvar (dead code nu, men ofarligt)

