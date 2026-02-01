
## Plan: Lägg till AVIF-stöd med automatisk konvertering

### Sammanfattning
AVIF-bilder behöver konverteras till JPEG innan de skickas till Remove.bg API:et (som bara stöder JPG/PNG/WebP). Vi gör en **minimal ändring** som konverterar AVIF → JPEG direkt vid uppladdning. Resten av flödet påverkas inte alls.

---

### Teknisk bakgrund

| Komponent | AVIF-stöd |
|-----------|-----------|
| **Remove.bg API** | ❌ Bara JPG, PNG, WebP |
| **Canvas API (webbläsare)** | ✅ 95% av webbläsare |
| **Gemini API** | ✅ Fungerar |

---

### Lösning: 2 små ändringar

#### Steg 1: Lägg till "image/avif" i tillåtna format

**Fil:** `src/lib/validation.ts`

Lägg till `"image/avif"` i `ALLOWED_IMAGE_TYPES` arrayen och uppdatera felmeddelandet.

```typescript
export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
  "image/avif",  // ← Ny rad
];
```

#### Steg 2: Konvertera AVIF → JPEG vid uppladdning

**Fil:** `src/components/PhotoUpload.tsx`

Lägg till en konverteringsfunktion som körs innan filen laddas upp:

```typescript
const convertToJpegIfNeeded = async (file: File): Promise<File> => {
  // Bara konvertera AVIF-filer
  if (file.type !== 'image/avif') {
    return file;
  }
  
  // Ladda bilden i en Image-element
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = URL.createObjectURL(file);
  });
  
  // Rita på canvas och exportera som JPEG
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  
  // Städa upp
  URL.revokeObjectURL(img.src);
  
  // Konvertera till JPEG blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.95);
  });
  
  // Returnera som ny File
  const newFileName = file.name.replace(/\.avif$/i, '.jpg');
  return new File([blob], newFileName, { type: 'image/jpeg' });
};
```

Sedan anropa denna funktion i `handleUpload` innan filen laddas upp till storage.

#### Steg 3: Uppdatera accept-attributet

**Fil:** `src/components/PhotoUpload.tsx`

Lägg till `image/avif` i input-elementets accept-attribut:

```html
accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif"
```

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `src/lib/validation.ts` | Lägg till `"image/avif"` |
| `src/components/PhotoUpload.tsx` | Lägg till `convertToJpegIfNeeded()` funktion |

---

### Varför detta är LOW RISK

1. **Ingen edge function ändras** - All konvertering sker i frontend
2. **Ingen databasändring** - Inga migrationer behövs  
3. **Existerande format påverkas inte** - JPG/PNG/WebP går rakt igenom
4. **Beprövad teknik** - Canvas API:et för bildkonvertering används redan i appen (watermark.ts, carCompositing.ts)
5. **Fallback** - Om konverteringen misslyckas får användaren ett felmeddelande, appen kraschar inte

---

### Flödesdiagram

```text
┌─────────────────────────────────────────────────────────────┐
│  NUVARANDE FLÖDE (AVIF blockeras)                          │
├─────────────────────────────────────────────────────────────┤
│  AVIF → validateImageFile() → "Filtypen stöds inte" ❌     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│  NYTT FLÖDE (AVIF → JPEG konvertering)                     │
├─────────────────────────────────────────────────────────────┤
│  AVIF → validateImageFile() ✅                             │
│       → convertToJpegIfNeeded() → JPEG                     │
│       → Upload till storage (som JPEG)                     │
│       → Remove.bg → Canvas → Gemini (allt fungerar)        │
└─────────────────────────────────────────────────────────────┘
```
