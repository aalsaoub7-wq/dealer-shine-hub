

# Fix: Spara transparent_url vid AI-fel

## Sammanfattning

**Charging**: Användare blir INTE debiterade vid AI-fel — all billing sker bara i success-paths. ✅ Inget att fixa.

**Transparent URL**: Vid Gemini-fel i batch-flödet (`processGeminiQueue`) sparas inte `transparent_url` eller `original_url`, trots att de redan finns i job-objektet. Det innebär att remove.bg-segmenteringen går förlorad och måste köras om vid retry.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`

### 1. `processGeminiQueue` error handler (~rad 893–895)

Ändra från:
```typescript
await supabase.from("photos").update({ is_processing: false }).eq("id", job.photoId);
```

Till:
```typescript
await supabase.from("photos").update({ 
  is_processing: false,
  transparent_url: job.transparentUrl,
  original_url: job.originalUrl,
}).eq("id", job.photoId);
```

### 2. `executePositionSave` error handler (~rad 1532–1533)

Samma mönster — spara `transparent_url` om den finns tillgänglig. Här behöver vi kolla vilken data som finns i scope. Bilden som redigeras via "Justera position" har redan `transparent_url` i DB (den hämtas därifrån), så denna path behöver inte ändras.

## Vad som INTE ändras
- Billing/tracking — redan korrekt (bara i success paths)
- Interior-flöden — orörda
- Edge functions — orörda
- Regenereringsflöden — `transparent_url` finns redan i DB vid retry

## Risk
Extremt låg. En enda DB-update utökas med två extra fält som redan finns tillgängliga.

