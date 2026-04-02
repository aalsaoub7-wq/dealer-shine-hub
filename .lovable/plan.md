

# Fix: Ta bort 3dicons och ersätt med gradient-stilade Lucide-ikoner

## Problem
3dicons.co-bilderna har vita bakgrunder som ser hemskt ut på de mörka korten. De ser platta och billiga ut.

## Lösning
Gå tillbaka till Lucide-ikoner men ge dem en unik look med **SVG-gradienter** — varje ikon får en individuell gradient-fill som matchar sidans primärfärger (rosa → orange). Detta ger en premium, custom-känsla utan externa beroenden.

## Tekniska ändringar

### `src/pages/Landing.tsx`

1. **Ta bort alla `<img>`-taggar** för 3dicons
2. **Importera tillbaka** Lucide-ikoner: `Sparkles, FolderOpen, Stamp, Link, UsersRound, Smartphone`
3. **Lägg till en inline SVG `<defs>` med en gradient-definition** högst upp i features-sektionen:
```tsx
<svg width="0" height="0" className="absolute">
  <defs>
    <linearGradient id="icon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="hsl(var(--primary))" />
      <stop offset="100%" stopColor="#f97316" />
    </linearGradient>
  </defs>
</svg>
```
4. **Varje ikon** renderas med `style={{ stroke: 'url(#icon-gradient)' }}` och `className="h-8 w-8 shrink-0"` — detta ger varje ikon en unik gradient-stroke som inte ser generiskt ut
5. Välj mer unika Lucide-ikoner än förut:
   - `Sparkles` istället för Brain (AI edit)
   - `FolderOpen` istället för Package (lager)  
   - `Stamp` istället för Shield (vattenmärke)
   - `Link` (delning)
   - `UsersRound` (team)
   - `Smartphone` (app)

## Vad som INTE ändras
- All text, bento-layout, hover-effekter — identiskt
- PWAInstallButton — kvar
- Övriga sektioner — orörda

## Risk
Extremt låg. Byter tillbaka till lokala SVG-ikoner, tar bort externt CDN-beroende.

