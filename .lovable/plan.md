

## Fix: Aram Carcenter kan inte komma in + skydd mot att det händer igen

### Rotorsak

Databasetriggern `handle_new_user_company` borde ha skapat ett företag för `info@carcenterlidkoping.se` när de registrerade sig med koden `ARAMC-M4DJ`. Triggern misslyckades tyst — inga felloggar finns — och användaren hamnade som en "lead" istället för att få ett företag.

Konsekvens: `get-billing-info` hittar ingen företagskoppling och kastar ett fel, vilket gör att paywallen visas.

### Åtgärd 1: Fixa Aram omedelbart (SQL)

Kör en migration som gör exakt det som triggern borde ha gjort:

```sql
-- 1. Skapa företag med Stripe-kopplingen
INSERT INTO public.companies (name, stripe_customer_id, trial_end_date, trial_images_remaining)
VALUES ('Aram Carcenter', 'cus_TvibGYdOz13dJV', NULL, 0)
RETURNING id;

-- 2. Länka användaren till företaget (user_companies + user_roles)
-- Användar-ID: a77ac3e4-8778-4d26-bab3-5773cfe53231

-- 3. Markera signup-koden som använd

-- 4. Ta bort lead-raden
DELETE FROM public.leads WHERE email = 'info@carcenterlidkoping.se';
```

### Åtgärd 2: Skydd mot framtida fall (1 fil)

**`supabase/functions/get-billing-info/index.ts`**

Lägg till en "self-healing" fallback direkt efter checken `if (!userCompany?.companies)`. Istället för att omedelbart kasta ett fel, kontrollera om användaren har en oanvänd signup-kod i sin metadata. Om ja -- skapa företaget, länka användaren och markera koden som använd. Sedan fortsätt som vanligt.

Logiken (pseudokod):

```text
if (inget företag hittat) {
  hämta user metadata via admin API
  om signup_code finns i metadata {
    hämta koden från signup_codes (unused)
    om koden finns {
      skapa företag med stripe_customer_id från koden
      länka user_companies + user_roles (admin)
      markera koden som använd
      ta bort lead-raden
      fortsätt med det nya företaget
    }
  }
  om fortfarande inget företag -> kasta fel som vanligt
}
```

### Vad som händer

- Aram kan logga in direkt efter SQL-migrationen
- Om triggern misslyckas för framtida kunder, fångar `get-billing-info` upp det automatiskt
- Befintliga kunder påverkas INTE (fallbacken körs bara om ingen företagskoppling finns)
- Ingen ändring i frontend, signup-flöde eller trigger

### Risk

- **SQL-migrationen**: Ingen risk -- skapar en ny rad, inga befintliga data ändras
- **get-billing-info ändringen**: Mycket låg risk -- koden körs BARA om det normala flödet redan har misslyckats. Om fallbacken också misslyckas, kastas samma fel som innan.

### Filer som ändras

1. SQL-migration (ny) -- skapa företag + kopplingar för Aram
2. `supabase/functions/get-billing-info/index.ts` -- lägg till fallback efter rad 68-69

