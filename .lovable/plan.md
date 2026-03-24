

# Skippa SMS-verifiering — spara nummer direkt

## Vad som ändras

**Enda fil:** `src/pages/Verify.tsx`, funktionen `sendPhoneOtp` (rad 135–166)

## Ändring

Byt ut innehållet i `sendPhoneOtp`. Istället för att anropa `send-phone-otp` edge function (Vonage SMS), gör följande:

1. Anropa `get-verification-status` för att hämta användarens verifieringspost (behövs för att veta att den finns)
2. Anropa `verify-code` edge function — **nej, den kräver en giltig kod**

Bättre approach: Skapa ett direkt anrop till edge function `get-verification-status` som redan använder service role. Men vi kan inte uppdatera via klienten (RLS blockerar `user_verifications`).

**Enklaste lösningen:** Ändra `sendPhoneOtp` till att istället anropa en edge function som sparar numret och sätter `phone_verified = true`. Vi kan använda befintliga `verify-code` edge function — men den kräver en kod.

**Faktisk minimal lösning:** Ändra `sendPhoneOtp` att:
1. Anropa `send-phone-otp` edge function som vanligt (den sparar numret i DB)
2. Direkt efter, anropa `verify-code` med den kod som `send-phone-otp` genererade — men vi har inte tillgång till koden på klientsidan.

**Bästa minimala lösning:** Modifiera `sendPhoneOtp` i Verify.tsx att:
1. Anropa `send-phone-otp` som vanligt (sparar numret + genererar kod)
2. Hoppa direkt till att anropa `verify-code` med den genererade koden

Men vi har inte koden... Låt mig tänka om.

**Allra enklaste:** Ändra `send-phone-otp` edge function att acceptera en `skipSms: true` parameter och returnera koden, sedan verifiera direkt. Nej, det är för riskabelt.

**Faktiskt enklaste och säkraste:** Skapa logiken i `sendPhoneOtp` på klienten att:
1. Istället för att anropa `send-phone-otp`, anropa `get-verification-status` edge function (som redan har service role access) — men den kan inte uppdatera.

OK, den verkligt minimala lösningen:

### Ändring 1: `src/pages/Verify.tsx` — `sendPhoneOtp` (rad 135–166)

Byt ut edge function-anropet mot ett anrop som sparar numret och markerar det som verifierat direkt. Eftersom `user_verifications` har RLS som blockerar klientaccess, behöver vi en edge function.

### Ändring 2: Ny edge function `save-phone-number/index.ts`

Minimal edge function som:
1. Verifierar JWT (samma mönster som `get-verification-status`)
2. Validerar att telefonnumret ser rimligt ut
3. Kör `supabase.from("user_verifications").update({ phone_number, phone_verified: true }).eq("user_id", userId)`
4. Returnerar success

### Klientändring i `sendPhoneOtp`:
```typescript
const sendPhoneOtp = async () => {
  if (!user || !phoneNumber) return;
  setLoading(true);
  try {
    const { data, error } = await supabase.functions.invoke("save-phone-number", {
      body: { phoneNumber },
    });
    if (error) throw error;
    if (data?.error) { toast({ title: "Fel", description: data.error, variant: "destructive" }); return; }
    navigate("/dashboard");
  } catch (error: any) {
    toast({ title: "Fel", description: error.message || "Kunde inte spara nummer", variant: "destructive" });
  } finally {
    setLoading(false);
  }
};
```

Steg `phone-verify` (OTP-inmatning) visas aldrig — användaren går direkt från nummerbegäran till dashboard.

## Risk
Extremt låg. En ny isolerad edge function + ändring av en enda funktion i Verify.tsx. Inget befintligt tas bort. `send-phone-otp` och `verify-code` förblir orörda.

