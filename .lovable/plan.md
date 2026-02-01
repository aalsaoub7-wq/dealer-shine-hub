

## Plan: Ta bort alla trial-kontroller för att förhindra "trial har gått ut" meddelanden

### Problemet

Din anställda (filip.521.cross@gmail.com) såg "Din testperiod har gått ut" trots att det INTE finns några trials i systemet. Alla kunder har custom-avtal.

### Rotorsaken

Flera ställen i koden har kvar gammal trial-logik som orsakar falska positiva "trial expired" meddelanden:

| Fil | Problem |
|-----|---------|
| `ProtectedRoute.tsx` | Kollar `isInTrial` för att avgöra om paywall ska visas |
| `CarDetail.tsx` | Kollar `isInTrial` för att avgöra om användaren kan redigera |
| `PaymentSettings.tsx` | Visar "Testperiod Löpt Ut" card |

### Lösning (MINIMAL & LOW RISK)

Ändra logiken så att redigering tillåts om **NÅGON** av dessa är sann:
1. `hasPaymentMethod = true` (betalmetod finns)
2. `hasActiveSubscription = true` (aktiv prenumeration finns)
3. `isAdmin = false` (anställda ska ALLTID ha tillgång om företaget har access)

**INGEN trial-logik behövs längre.**

---

### Steg 1: Fixa ProtectedRoute.tsx (rad 62-83)

**Före:**
```typescript
const isAdmin = data?.isAdmin ?? true;  // ⚠️ FARLIGT DEFAULT
const isInTrial = data?.trial?.isInTrial ?? true;
// ...
if (!isInTrial && !hasPaymentMethod && !subscriptionStillValid && isAdmin) {
  return { showPaywall: true, paymentFailed: false };
}
```

**Efter:**
```typescript
const isAdmin = data?.isAdmin ?? false;  // ✅ SÄKERT DEFAULT
const hasActiveSubscription = data?.hasActiveSubscription ?? false;

// Employees NEVER see paywall - only admins can be blocked
if (!isAdmin) {
  return { showPaywall: false, paymentFailed: false };
}

// Admin: block only if no payment method AND no active subscription
if (!hasPaymentMethod && !hasActiveSubscription && !subscriptionStillValid) {
  return { showPaywall: true, paymentFailed: false };
}
```

---

### Steg 2: Fixa CarDetail.tsx checkPaymentMethod (rad 301-319)

**Före:**
```typescript
const canEdit = data?.trial?.isInTrial || data?.hasPaymentMethod || false;
```

**Efter:**
```typescript
const hasAccess = data?.hasPaymentMethod || data?.hasActiveSubscription || false;
setHasPaymentMethod(hasAccess);
```

---

### Steg 3: Ta bort trial-meddelanden i CarDetail.tsx (rad 567-595)

**Före:**
```typescript
if (!hasPaymentMethod) {
  toast({
    description: trialInfo?.isInTrial 
      ? "Du måste lägga till en betalmetod..."
      : "Din testperiod har löpt ut..."
  });
}
```

**Efter:**
```typescript
if (!hasPaymentMethod) {
  toast({
    title: "Betalmetod krävs",
    description: "Kontakta din admin för att få tillgång till redigering."
  });
}
```

---

### Steg 4: Ta bort "Testperiod Löpt Ut" card i PaymentSettings.tsx

Ta bort hela `trialExpired && !loading && (...)` blocket som visar "Testperiod Löpt Ut" kortet.

---

## Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/components/ProtectedRoute.tsx` | Ändra default `isAdmin` till `false`, ta bort `isInTrial` logik |
| `src/pages/CarDetail.tsx` | Ändra `canEdit` logik, ta bort trial-meddelanden |
| `src/components/PaymentSettings.tsx` | Ta bort "Testperiod Löpt Ut" card |

---

## Varför detta är LOW RISK

1. **Ingen ändring i edge functions** - All logik ändras i frontend
2. **Ingen databasändring** - Ingen migration krävs
3. **Anställda får ALLTID access** - Vi lägger till explicit check `if (!isAdmin) return { showPaywall: false }`
4. **Admins blockeras bara om INGEN betalmetod OCH INGEN prenumeration** - Samma som nu, men utan trial-förvirring

## Resultat

Efter dessa ändringar kommer INGEN NÅGONSIN se "testperiod har gått ut" igen, eftersom:
- Anställda får alltid access (baserat på företagets prenumeration)
- Admins blockeras bara om de faktiskt saknar betalmetod OCH prenumeration
- Alla trial-relaterade meddelanden tas bort

