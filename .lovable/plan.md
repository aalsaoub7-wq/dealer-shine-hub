

## Plan: Fixa "Bilder Behandlas" som fastnar för alltid

### Problemet som identifierats

Jag har hittat **exakt VAR** problemet ligger:

| Rad | Funktion | Problem |
|-----|----------|---------|
| **1259** | `handlePositionEditorSave` | Anropar `add-reflection` **UTAN** `withTimeout` |
| 2089 | Interior Background Dialog | Anropar `segment-car` utan timeout (lägre risk) |

**Varför Joels Bil fastnar:**
När användaren positionerar om en bil och klickar "Spara", sätts `is_processing: true` (rad 1214), men sedan anropas Gemini AI **utan tidsgräns** (rad 1259). Om Gemini hänger eller tar för lång tid → bilden fastnar i "Bild Behandlas" för alltid.

---

### Åtgärder (MINIMAL, EXTREMT LOW RISK)

**Endast 2 rader ändras** i `src/pages/CarDetail.tsx`:

#### Fix 1: Lägg till timeout på handlePositionEditorSave (rad 1259)

**Före:**
```typescript
const { data: reflectionData, error: reflectionError } = await supabase.functions.invoke("add-reflection", {
  body: reflectionFormData,
});
```

**Efter:**
```typescript
const { data: reflectionData, error: reflectionError } = await withTimeout(
  supabase.functions.invoke("add-reflection", { body: reflectionFormData }),
  120000, // 2 minuter timeout som användaren bad om
  "Vår AI fick för många bollar att jonglera"
);
```

#### Fix 2: Lägg till timeout på Interior Background segmentering (rad 2089)

**Före:**
```typescript
const { data: segmentData, error: segmentError } = await supabase.functions.invoke("segment-car", {
  body: segmentFormData,
});
```

**Efter:**
```typescript
const { data: segmentData, error: segmentError } = await withTimeout(
  supabase.functions.invoke("segment-car", { body: segmentFormData }),
  60000, // 60 sekunders timeout (samma som andra segment-anrop)
  "Vår AI fick för många bollar att jonglera"
);
```

---

### Varför detta är EXTREMT LOW RISK

| Kontroll | Status |
|----------|--------|
| Ändrar befintlig logik | ❌ NEJ - bara lägger till timeout-wrapper |
| Nya funktioner | ❌ NEJ - använder befintlig `withTimeout` |
| Påverkar lyckade anrop | ❌ NEJ - 2 min är gott om tid för Gemini |
| Databasändringar | ❌ NEJ |
| Nya dependencies | ❌ NEJ |
| Befintliga kunder påverkas | ❌ NEJ - befintligt flöde fungerar som förut |

---

### Befintligt skyddsnät (redan på plats)

Systemet har redan backup-lösningar:

1. **`resetStuckPhotos()`** - Körs vid sidladdning, nollställer bilder som fastnat >10 min
2. **Realtime-prenumeration** - Uppdaterar UI automatiskt när `is_processing: false` sätts
3. **Error handler** - Fångar fel och nollställer `is_processing`

Det enda som saknades var **timeout** på just dessa två API-anrop.

---

### Användarpåverkan

| Scenario | Före | Efter |
|----------|------|-------|
| Gemini svarar inom 2 min | ✅ Fungerar | ✅ Fungerar (ingen förändring) |
| Gemini hänger | ❌ Fastnar för alltid | ✅ Timeout efter 2 min + toast |

---

### Toast-meddelande vid timeout

Det exakta meddelandet användaren bad om:

> **"Vår AI fick för många bollar att jonglera"**

Visas med `variant: "info"` (samma stil som andra AI-fel).

---

### Teknisk sammanfattning

Endast **2 punktändringar** i en fil:

```text
src/pages/CarDetail.tsx
├── Rad 1259: Lägg till withTimeout(120000) på add-reflection
└── Rad 2089: Lägg till withTimeout(60000) på segment-car
```

Totalt ändras ~6 rader kod. Inget annat påverkas.

