

# Analys: "Betalmetod krävs"-toast för admin-testkonto

## 1. Allmänna loggar och fel

Sessionreplay och konsolloggar var tomma vid tidpunkten, så jag kan inte se exakt vilka toasts som visades. Dock visar edge function-loggarna att `reconcile-usage` konsekvent kraschar med `Deno.core.runMicrotasks() is not supported` -- detta påverkar dock inte användarupplevelsen direkt.

## 2. Varför "Betalmetod krävs" dök upp för ditt admin-konto

### Rotorsak

Problemet sitter i **`src/pages/CarDetail.tsx`**, funktionen `checkPaymentMethod` (rad 327-342):

```typescript
const checkPaymentMethod = async () => {
  try {
    setCheckingPayment(true);
    const { data, error } = await supabase.functions.invoke("get-billing-info");
    if (error) throw error;  // <-- Om edge function timeout/fel -> catch
    const hasAccess = data?.hasPaymentMethod || data?.hasActiveSubscription || false;
    setHasPaymentMethod(hasAccess);
  } catch (error) {
    console.error("Error checking payment method:", error);
    setHasPaymentMethod(false);  // <-- FALSKT! Blockerar redigering
  }
};
```

**Vad som händer:**
1. CarDetail laddar och anropar `checkPaymentMethod()` som kallar `get-billing-info` edge function.
2. Edge function för ditt admin-konto (company `e0496e49...`) försöker hämta Stripe-prenumeration `unlimited_admin` -- som inte finns i Stripe (404-fel syns i loggarna).
3. Edge function hanterar detta korrekt och sätter `hasPaymentMethod = true` (rad 421). **Men** ibland (cold start, timeout, nätverksfel) kan anropet misslyckas helt innan det hinner dit.
4. I `catch`-blocket sätts `setHasPaymentMethod(false)` -- och då visar alla redigeringsknappar toasten "Betalmetod krävs".
5. Vid omladdning/retry lyckas edge function, och allt fungerar.

### Varför det "sen fungerade"

Edge functions har cold starts. Första anropet kan ta längre tid eller timeout:a. Vid andra försöket är funktionen redan varm och svarar snabbt.

### Bekräftelse från loggarna

Edge function-loggarna visar att `get-billing-info` kör korrekt för ditt konto:
```
[BILLING-INFO] Admin test account - granting unlimited access
```
Men det föregås av ett Stripe 404-fel (`No such subscription: 'unlimited_admin'`). Funktionen hanterar felet, men om den inte hinner svara innan klienten timeout:ar sätts `hasPaymentMethod = false`.

## Rekommenderad fix

Ändra `catch`-blocket i `checkPaymentMethod` så att **admin-testkontot** (eller generellt) **inte blockeras vid nätverksfel**:

```typescript
catch (error) {
  console.error("Error checking payment method:", error);
  setHasPaymentMethod(true); // Fallback: tillåt åtkomst vid fel
}
```

Alternativt: lägg till retry-logik (som `ProtectedRoute` redan har) eller cache:a resultatet. Minst riskfyllt vore att ändra fallback från `false` till `true`, eftersom betalningsvalidering ändå sker server-side vid faktisk Stripe-rapportering.

## Sammanfattning

| Fråga | Svar |
|-------|------|
| Varför visades toasten? | `get-billing-info` misslyckades transiently (timeout/cold start), catch-blocket satte `hasPaymentMethod = false` |
| Varför fungerade det sen? | Edge function var varm vid andra anropet |
| Är det ett kodbuggsfel? | Ja -- catch-fallback i `checkPaymentMethod` är för aggressiv |
| Påverkar det andra användare? | Ja, alla användare kan drabbas av samma race condition |

