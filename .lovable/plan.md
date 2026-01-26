
## Plan: Fixa interiörbakgrund för låsta bakgrunder

### Problemet
Låsta bakgrunder (t.ex. `joels-bil-v1`) har **tomma `interior_backgrounds` arrays** i databasen. Koden kollar endast om arrayen finns och är en array, men kontrollerar inte om den är tom.

**Nuvarande data i databasen:**
| Template | interior_backgrounds |
|----------|---------------------|
| joels-bil-v1 | `[]` (tom) |
| spotlight-studio | `["/backgrounds/spotlight-studio.jpg"]` |

### Lösning: Fallback till mallens egen bild

**Fil:** `src/pages/CarDetail.tsx`

**Rad 233-236, ändra från:**
```tsx
// Set interior backgrounds from database
if (template?.interior_backgrounds && Array.isArray(template.interior_backgrounds)) {
  setAvailableInteriorBackgrounds(template.interior_backgrounds);
}
```

**Till:**
```tsx
// Set interior backgrounds from database
// If interior_backgrounds is empty, fallback to using the template's own image_url
if (template?.interior_backgrounds && Array.isArray(template.interior_backgrounds) && template.interior_backgrounds.length > 0) {
  setAvailableInteriorBackgrounds(template.interior_backgrounds);
} else if (template?.image_url) {
  // Fallback: use the template's own background image for interior editing
  setAvailableInteriorBackgrounds([template.image_url]);
}
```

### Vad detta gör
- Om `interior_backgrounds` är en icke-tom array → använd den (befintligt beteende)
- Om `interior_backgrounds` är tom ELLER null → använd mallens egen `image_url` som fallback

### Riskanalys

| Aspekt | Påverkan |
|--------|----------|
| Befintliga mallar med interior_backgrounds | Ingen ändring - samma beteende |
| Låsta bakgrunder med tom array | Får nu sin egen bild som interiöralternativ |
| Andra funktioner | Ingen påverkan |

### Filer som ändras
- `src/pages/CarDetail.tsx` - En ändring på rad 234-236 (lägg till `length > 0` check och else-fallback)
