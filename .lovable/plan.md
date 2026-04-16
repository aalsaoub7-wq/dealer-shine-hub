

# Fix: Stäng de två återstående buggkällorna

## Problemsammanfattning
Analysen identifierar två bekräftade brister:

1. **segment-car returnerar samma URL vid re-edit** → browser cache visar gammal transparent-bild
2. **handleSave i CarPositionEditor saknar session token-guard** → kan exportera canvas med fel bilds data

## Ändringar

### 1. segment-car: Lägg till timestamp i filnamn
**Fil:** `supabase/functions/segment-car/index.ts`

Ändra rad 91-92 från:
```
`${carId}/transparent-${photoId}.png`
```
till:
```
`${carId}/transparent-${photoId}-${timestamp}.png`
```

Detta gör att varje ny segmentering får en unik URL. Browser cache kan aldrig servera en gammal version. `timestamp` finns redan som variabel på rad 90.

### 2. handleSave: Lägg till session token-guard
**Fil:** `src/components/CarPositionEditor.tsx`

I `handleSave` (rad 748), lägg till check direkt efter de befintliga guards:
```tsx
if (sessionToken && activeSessionTokenRef.current !== sessionToken) return;
```

Detta förhindrar att en stale save exporterar canvas-data från en tidigare session.

### 3. Cache-busting på klientsidan
**Fil:** `src/pages/CarDetail.tsx`

När `segment-car` returnerar URL:en, lägg till `?t={timestamp}` som query-param vid inladdning i editorn. Detta skyddar mot eventuell CDN-cache även med nya filnamn:
```tsx
const urlWithCacheBust = `${segmentData.url}?t=${Date.now()}`;
```

## Risk
- Låg. Inga databas-, RLS- eller logik-ändringar.
- segment-car skriver redan med `upsert: true`, så gamla filer rensas inte men tar inte plats på fel ställe.
- Gamla `transparent_url`-värden i DB pekar på gamla paths, men de används bara som cache-check vid re-edit — de laddas om via segment-car ändå.

## Verifiering
- Batch-redigera 5+ bilder, verifiera unika blob-storlekar i console-loggar
- Re-edit samma foto, verifiera att ny transparent URL returneras
- Snabb save efter fotoväxling — verifiera att session token-guard blockerar stale saves

