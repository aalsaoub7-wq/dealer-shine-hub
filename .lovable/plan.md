

## Fix: share-preview deploya korrekt

### Rotorsak
Edge-funktionen `share-preview` returnerar 404 ("Requested function was not found") -- den har aldrig lyckats deployas. Anledningen är troligen att importen `@supabase/supabase-js@2.49.1` (specifik patch-version) orsakar bundle-timeout. Alla andra fungerande funktioner i projektet använder `@supabase/supabase-js@2` utan patch-version.

### Vad som ändras

**1. Fixa importen i `supabase/functions/share-preview/index.ts`**
- Ändra `https://esm.sh/@supabase/supabase-js@2.49.1` till `https://esm.sh/@supabase/supabase-js@2` (matchar alla andra fungerande funktioner)

**2. Deploya funktionen**
- Force-deploya `share-preview` efter importändringen

**3. Verifiera**
- Testa funktionen med ett testanrop för att bekräfta att den returnerar HTML istället för 404

### Vad som INTE ändras
- Logiken i funktionen -- den är korrekt
- CarDetail.tsx -- delningskoden är redan korrekt kopplad
- Config.toml -- redan korrekt konfigurerad
- Inga andra funktioner påverkas

### Risk
Minimal -- en enda import-rad ändras till samma mönster som alla andra fungerande funktioner använder.

### Teknisk detalj
Rad 2 i `share-preview/index.ts` ändras:
```text
Före:  import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
Efter: import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
```

