
## Problem

När Blocket-sync misslyckas visar UI:t bara "Edge Function returned a non-2xx status code". Det verkliga felet (t.ex. "Invalid token: Invalid JWT format") finns i edge-funktionens response body men läses aldrig ut.

## Orsak

I `src/lib/blocket.ts` rad 21–26 fångas `error` från `supabase.functions.invoke()`, men vid ett HTTP-fel (status 500) returnerar Supabase-klienten ett `FunctionsHttpError` där `.message` bara är det generiska meddelandet. Den faktiska JSON-bodyn med `{ error: "..." }` finns i `error.context` (response-objektet) men konsumeras aldrig.

## Lösning

**Fil: `src/lib/blocket.ts`** — Uppdatera `syncCarToBlocket` så att den:
1. Kontrollerar om `error` är en `FunctionsHttpError` 
2. Läser ut response body via `error.context?.json()` för att extrahera det riktiga felmeddelandet
3. Visar det riktiga meddelandet i felreturen

Ändringen är ~5 rader i error-hanteringen, ingen annan fil berörs.

## Teknisk detalj

```typescript
// Nuvarande (generiskt):
if (error) {
  return { ok: false, error: error.message };
}

// Nytt (specifikt):
if (error) {
  let detail = error.message;
  try {
    const body = await error.context?.json();
    if (body?.error) detail = body.error;
  } catch {}
  return { ok: false, error: detail };
}
```
