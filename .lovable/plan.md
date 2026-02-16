
# Ge SA BIL I LIDKÖPING tillgang till appen

## Problem
Anvandaren "SA BIL I LIDKOPING" (faktura@sabil.nu, user_id: ab753c8d-ae03-4bdf-87c7-29d45f3b097c) blockeras av tva saker:

1. **Telefon-verifiering saknas** - `phone_verified = false` i `user_verifications`-tabellen. Appen kraver bade email och telefon-verifiering for att slappa in anvandaren.
2. **Lokal prenumerationsrad saknas** - Stripe har en aktiv prenumeration (sub_1T1VqLRrATtOsqxEZlchcekw) men det finns ingen motsvarande rad i `subscriptions`-tabellen. (Self-healing i get-billing-info borde losa detta automatiskt nar anvandaren kommer forbi verifieringen, men vi fixar det direkt for sakerhets skull.)

## Losning - Enbart databasandring

Kora **en enda SQL-migration** som:

1. Satter `phone_verified = true` for anvandaren i `user_verifications`
2. Skapar en `subscriptions`-rad med data fran Stripe

```sql
-- 1. Markera telefon som verifierad
UPDATE public.user_verifications
SET phone_verified = true, updated_at = now()
WHERE user_id = 'ab753c8d-ae03-4bdf-87c7-29d45f3b097c';

-- 2. Skapa lokal prenumerationsrad (data fran Stripe)
INSERT INTO public.subscriptions (
  company_id, stripe_subscription_id, stripe_customer_id, 
  status, current_period_start, current_period_end
)
VALUES (
  '2882c79b-1ae5-41ab-af36-d7a4d8592010',
  'sub_1T1VqLRrATtOsqxEZlchcekw',
  'cus_TzUqCa6ENVbzwe',
  'active',
  '2026-02-16T17:44:21Z',
  '2026-03-16T17:44:21Z'
)
ON CONFLICT DO NOTHING;
```

## Vad andras INTE
- Ingen kod, inga filer, inga komponenter
- Ingen edge function, ingen frontend-logik
- Inga andra anvandare paverkas
- Extremt minimal, zero-risk andring - enbart data for denna specifika anvandare
