

## Fix: Ta bort trial-triggern som alltid ger nya kunder en 21-dagars provperiod

### Rotorsak

Det finns en BEFORE INSERT-trigger pa `companies`-tabellen som ALLTID overskrider `trial_end_date` till `created_at + 21 dagar`, oavsett vad som skickas in:

```text
set_trial_end_date_trigger -> set_trial_end_date()
  NEW.trial_end_date := NEW.created_at + interval '21 days';
```

Det spelar ingen roll att vi satter `trial_end_date: NULL` i SQL eller i self-healing-koden — triggern overskrider vardet varje gang ett foretag skapas.

### Atgard (1 SQL-migration, 0 kodfiler)

En enda SQL-migration som gor tva saker:

1. **Droppar triggern och funktionen** — ingen ny kund far nagonsin en trial igen
2. **Fixar Aram Carcenters data** — satter `trial_end_date = NULL` sa att de inte ser trial-information

```text
DROP TRIGGER set_trial_end_date_trigger ON companies;
DROP FUNCTION set_trial_end_date();
UPDATE companies SET trial_end_date = NULL WHERE name = 'Aram Carcenter';
```

### Vad som hander

- Aram ser inte langre nagon trial-info
- Framtida foretag (bade fran self-healing och manuella SQL-migrationer) far `trial_end_date = NULL` som avsett
- Befintliga aktiva kunder paverkas INTE (deras `trial_end_date` ar redan NULL eller har redan passerat)
- Ingen kodandring i frontend eller edge functions

### Risk

**Minimal** — triggern gor bara skada (ger alla nya foretag en oonskal trial). Att ta bort den aterstar korrekt beteende. Befintliga data rors inte (forutom Aram-fixen).

