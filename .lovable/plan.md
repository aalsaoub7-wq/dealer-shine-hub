

# Redesign: Feature-kort på landningssidan

## Problem
De nuvarande feature-korten följer ett generiskt AI/SaaS-mönster: 6 identiska kort i ett grid med ikon, rubrik, text. Det ser ut som varenda annan SaaS-landningssida.

## Ny design: Alternating timeline-layout

Istället för ett 3×2 grid → en **vertikal "bento"-layout** med varierad storlek och visuell hierarki:

```text
┌─────────────────────────┬──────────────┐
│  AI Bakgrundsredigering │ Lagerhanteri │
│  (stor, 2/3 bredd)      │ (1/3 bredd)  │
│  med gradient-accent    │              │
├──────────────┬──────────┴──────────────┤
│ Vattenmärken │  Delningsbara           │
│ (1/3 bredd)  │  Landningssidor (2/3)   │
├──────────────┴─────────────────────────┤
│  Team Collaboration  │  Installera    │
│  (1/2 bredd)         │  Appen (1/2)   │
└──────────────────────┴─────────────────┘
```

**Visuella element:**
- **Bento grid** med varierade kolumnspans (`col-span-2` / `col-span-1` på `lg:grid-cols-3`)
- Varje kort har en **tunn vänster-border med gradient** (primärfärg) istället för uniform border
- Ikonen sitter **inline med rubriken** (ej i egen box ovanför)
- Kort har **subtilt olika bakgrundsnyanser** — varannan med `bg-card`, varannan med en lite ljusare variant
- Hover: kort glowar med en **asymmetrisk skugga** (inte uniform scale)
- **Numrering** — varje kort har ett stort, halvtransparent nummer (01–06) i bakgrunden för visuell rytm
- Mobil: alla kort full-width, stacked

## Tekniska ändringar

### 1. `src/pages/Landing.tsx` — features-sektionen (rad 272–357)
- Byt ut `grid md:grid-cols-2 lg:grid-cols-3 gap-6` mot `grid lg:grid-cols-3 gap-4 md:gap-5`
- Kort 1 och 4 får `lg:col-span-2`, resten `lg:col-span-1`
- Varje kort: ta bort ikon-boxen, sätt ikon + rubrik på samma rad
- Lägg till bakgrundsnummer med `absolute top-2 right-4 text-6xl font-bold text-foreground/[0.03]`
- Byt border till `border-l-2 border-l-primary/40 border border-border/50`
- Hover: `hover:border-l-primary hover:shadow-[inset_0_0_30px_rgba(var(--primary),0.05)]` + `hover:translate-x-1`

### 2. `src/index.css` — inga ändringar behövs (befintliga variabler räcker)

## Vad som INTE ändras
- All text/info — identisk
- Ikoner — samma
- PWAInstallButton — kvar i sista kortet
- Sektionsrubrik — orörd
- Övriga sektioner — orörda

## Risk
Låg. Enbart className-ändringar i en sektion. Ingen logik ändras.

