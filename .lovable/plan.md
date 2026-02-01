

## Plan: Fixa bildordning på landningssidan

### Problemet

När bilder delas och visas på landningssidan är ordningen sporadisk. Detta beror på att bilderna hämtas utan sortering i `SharedPhotos.tsx`.

### Rotorsaken

| Plats | Kod | Problem |
|-------|-----|---------|
| `SharedPhotos.tsx` rad 83-86 | `.in("id", collectionData.photo_ids)` utan `.order()` | **INGEN SORTERING** |

När man använder `.in()` i Supabase returneras rader i godtycklig ordning, inte i ordningen som ID:n skickades.

### Lösning (1 ändring, 4 rader kod)

Sortera de hämtade bilderna i frontend så att de matchar ordningen i `photo_ids`-arrayen.

**Fil: `src/pages/SharedPhotos.tsx`**

Ändra rad 82-105 från:

```typescript
// Get photos
const { data: photos, error: photosError } = await supabase
  .from("photos")
  .select("id, url")
  .in("id", collectionData.photo_ids);

if (photosError) throw photosError;

setCollection({
  ...
  photos: photos || [],
});
```

Till:

```typescript
// Get photos
const { data: photos, error: photosError } = await supabase
  .from("photos")
  .select("id, url")
  .in("id", collectionData.photo_ids);

if (photosError) throw photosError;

// Sort photos to match the order in photo_ids array
const orderedPhotos = collectionData.photo_ids
  .map((id: string) => photos?.find((p) => p.id === id))
  .filter((p): p is Photo => p !== undefined);

setCollection({
  ...
  photos: orderedPhotos,
});
```

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/pages/SharedPhotos.tsx` | Lägg till sortering av bilderna baserat på `photo_ids` ordning |

---

### Varför detta är LOW RISK

1. **Endast 4 rader ny kod** - Minimal ändring
2. **Ingen edge function ändras** - All logik i frontend
3. **Ingen databasändring** - Ingen migration behövs
4. **Befintlig data fungerar** - Ordningen finns redan sparad i `photo_ids`
5. **Fallback** - Om en bild inte hittas filtreras den bort, ingen krasch

---

### Teknisk förklaring

```text
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE FLÖDE (SPORADISK ORDNING)                       │
├─────────────────────────────────────────────────────────────┤
│  photo_ids: ["abc", "def", "ghi"]                          │
│  Supabase .in() returnerar: ["ghi", "abc", "def"]          │
│  (godtycklig databasordning)                               │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  NYTT FLÖDE (BEVARAD ORDNING)                              │
├─────────────────────────────────────────────────────────────┤
│  photo_ids: ["abc", "def", "ghi"]                          │
│  Supabase .in() returnerar: ["ghi", "abc", "def"]          │
│  Frontend sorterar: ["abc", "def", "ghi"]                  │
│  (matchar ursprunglig ordning)                             │
└─────────────────────────────────────────────────────────────┘
```

