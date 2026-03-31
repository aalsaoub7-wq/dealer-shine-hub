

# 3D glans/pop-effekt på landningssidans knappar

## Vad som ändras

Lägg till en CSS-klass i `src/index.css` som ger knappar en glassaktig 3D-look med:
- En subtil `inset box-shadow` (vit highlight upptill → skapar glans)
- En mörkare `box-shadow` undertill → skapar djup
- Hover: förstärkt glans + liten `translateY(-1px)` för "pop"

Sedan applicera klassen på alla Button-element i `src/pages/Landing.tsx`.

## Tekniska detaljer

### 1. `src/index.css` — ny klass

```css
.btn-3d-gloss {
  position: relative;
  box-shadow: 
    inset 0 1px 0 0 rgba(255,255,255,0.25),
    0 2px 4px 0 rgba(0,0,0,0.2);
  transition: all 0.2s ease;
}
.btn-3d-gloss:hover {
  box-shadow: 
    inset 0 1px 0 0 rgba(255,255,255,0.35),
    0 4px 8px 0 rgba(0,0,0,0.25);
  transform: translateY(-1px);
}
.btn-3d-gloss:active {
  box-shadow: 
    inset 0 1px 0 0 rgba(255,255,255,0.15),
    0 1px 2px 0 rgba(0,0,0,0.2);
  transform: translateY(0px);
}
```

### 2. `src/pages/Landing.tsx` — lägg till `btn-3d-gloss` på alla knappar

- Rad 143 (Logga in)
- Rad 146 (Snacka med oss — header)
- Rad 208 (Snacka med oss — hero)
- Rad 211 (Se hur det fungerar — hero)
- Rad 825 (Snacka med oss — CTA)
- Eventuella mobila menyknappar

## Risk
Extremt låg. Enbart additivt CSS + className-tillägg. Ingen logik ändras.

