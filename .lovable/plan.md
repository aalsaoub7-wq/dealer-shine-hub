

## Plan: Förbättra SEO med fokus på AI-bilredigering

### Vad appen gör

Luvero är en **AI-driven bilredigeringsapp** som:
- Tar bort bakgrunder från bilfoton automatiskt
- Lägger till professionella studiobakgrunder
- Lägger till vattenmärken/logotyper
- Hjälper bilhandlare att få professionella bilder snabbt

### Nuvarande problem

| Problem | Beskrivning |
|---------|-------------|
| Meta description för kort | 91 tecken, bör vara 150-220 |
| Fel fokus i beskrivning | "bilhanterare" är för generellt, borde fokusera på **AI-redigering** |
| Saknar nyckelord | "ta bort bakgrund", "studiobakgrund", "redigera bilder" saknas |
| Bilder saknar alt-text | Logotyper har `alt=""` |
| 404-sida på engelska | Borde vara på svenska |

### Rätt sökord att använda

Baserat på vad appen faktiskt gör:

| Nyckelord | Relevans |
|-----------|----------|
| AI bilredigering | PRIMÄRT - Huvudfunktionen |
| ta bort bakgrund | PRIMÄRT - Kärnfunktion |
| studiobakgrund | PRIMÄRT - Kärnfunktion |
| bilfoton | SEKUNDÄRT - Målgrupp |
| bilhandlare/återförsäljare | SEKUNDÄRT - Målgrupp |
| vattenmärke | TERTIÄRT - Extrafunktion |

---

### Ändringar (5 filer, endast text/metadata)

#### Steg 1: Uppdatera meta description i index.html

**Fil:** `index.html`

**Före (91 tecken):**
```
Professionell bilhanterare för återförsäljare. AI-redigering av bilfoton på 20-30 sekunder.
```

**Efter (~180 tecken, rätt sökord):**
```
Luvero redigerar bilfoton med AI. Ta bort bakgrund och lägg till studiobakgrund automatiskt på 20 sekunder. Perfekt för bilhandlare som vill ha professionella bilder.
```

Uppdatera samma text i:
- `<meta name="description">`
- `<meta property="og:description">`
- `<meta name="twitter:description">`

Uppdatera även keywords:
```
luvero, ai bilredigering, ta bort bakgrund, studiobakgrund, bilfoton, bilhandlare, redigera bilder, professionella bilbilder, vattenstämpel
```

---

#### Steg 2: Uppdatera JSON-LD i Landing.tsx

**Fil:** `src/pages/Landing.tsx`

Ändra beskrivningarna i JSON-LD strukturerad data:

**Före:**
```javascript
"description": "Professionell bilhanterare för återförsäljare med AI-driven bakgrundsredigering."
```

**Efter:**
```javascript
"description": "Luvero redigerar bilfoton med AI. Ta bort bakgrund och lägg till studiobakgrund automatiskt. Perfekt för bilhandlare."
```

---

#### Steg 3: Lägg till alt-texter på bilder i Landing.tsx

**Fil:** `src/pages/Landing.tsx`

| Bild | Före | Efter |
|------|------|-------|
| luveroLogo (rad 121) | `alt=""` | `alt="Luvero AI bilredigering logotyp"` |
| luveroLogoText (rad 122) | `alt=""` | `alt="Luvero"` |
| App Store badge (rad 347) | `alt=""` | `alt="Ladda ner Luvero på App Store"` |
| Google Play badge (rad 348) | `alt=""` | `alt="Ladda ner Luvero på Google Play"` |

---

#### Steg 4: Förbättra 404-sidan med svenska texter

**Fil:** `src/pages/NotFound.tsx`

**Före:**
```tsx
<h1 className="mb-4 text-4xl font-bold">404</h1>
<p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
<a href="/" className="text-primary underline hover:text-primary/90">
  Return to Home
</a>
```

**Efter:**
```tsx
<h1 className="mb-4 text-4xl font-bold">404 - Sidan hittades inte</h1>
<p className="mb-4 text-xl text-muted-foreground">
  Sidan du letade efter finns inte längre.
</p>
<div className="flex flex-col gap-2">
  <a href="/" className="text-primary underline hover:text-primary/90">
    Tillbaka till startsidan
  </a>
  <a href="/auth" className="text-primary underline hover:text-primary/90">
    Logga in
  </a>
</div>
```

---

#### Steg 5: Uppdatera SEOHead.tsx default-texter

**Fil:** `src/components/SEOHead.tsx`

Uppdatera cleanup-funktionens default description (rad 60-63):

**Före:**
```typescript
"Professionell bilhanterare för återförsäljare. AI-redigering av bilfoton på 20-30 sekunder."
```

**Efter:**
```typescript
"Luvero redigerar bilfoton med AI. Ta bort bakgrund och lägg till studiobakgrund automatiskt på 20 sekunder. Perfekt för bilhandlare som vill ha professionella bilder."
```

---

### Filer som ändras

| Fil | Ändring |
|-----|---------|
| `index.html` | Längre meta description med rätt sökord |
| `src/pages/Landing.tsx` | JSON-LD + alt-texter |
| `src/pages/Auth.tsx` | Alt-texter på logotyper |
| `src/pages/NotFound.tsx` | Svensk 404-sida |
| `src/components/SEOHead.tsx` | Uppdaterad default description |

---

### Varför detta är LOW RISK

1. **Endast text/metadata-ändringar** - Ingen logik ändras
2. **Ingen databasändring** - Inga migrationer
3. **Inga edge functions** - All kod är frontend
4. **Inga nya beroenden** - Samma teknikstack
5. **Ingen funktionalitet påverkas** - Bara SEO-metadata och alt-texter

---

### Sökordsförbättring

| Sökord | Före | Efter |
|--------|------|-------|
| "AI bilredigering" | ✅ I title | ✅ I title + description |
| "ta bort bakgrund" | ❌ Saknas | ✅ I description |
| "studiobakgrund" | ❌ Saknas | ✅ I description |
| "bilfoton" | ✅ I title | ✅ I title + description |
| "bilhandlare" | ❌ Saknas | ✅ I description |
| "luvero" | ❌ Bara i title | ✅ Först i description |

