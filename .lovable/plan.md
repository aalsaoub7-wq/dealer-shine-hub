

# Uppdatera reflektionsinstruktionen i prompten

## Problem
Den nuvarande prompten säger "Remove all reflections visible on the car body paint" vilket gör att bilen kan se matt och onaturlig ut -- den tappar sin glans.

## Lösning
Byt ut den meningen mot en mer nyanserad instruktion som säger att oönskade omgivningsreflektioner (byggnader, träd, objekt) ska tas bort, men att bilen ska behålla sin naturliga glans och ljusreflektioner så att lacken fortfarande ser blank och realistisk ut.

### Ny mening (ersätter den gamla):

**Gammalt:** "Remove all reflections visible on the car body paint, but do not alter the car's color, shape, or any other details."

**Nytt:** "Remove any reflections of surrounding objects visible on the car body paint (such as trees, buildings, people, or other objects), but keep the natural light reflections and glossy highlights on the paint so the car still looks shiny and realistic -- do not make the paint look matte or flat."

## Fil som ändras

| Fil | Ändring |
|-----|---------|
| `supabase/functions/add-reflection/index.ts` | Byt ut en mening i prompten på rad 66 |

## Vad som inte ändras
- All annan logik, databas, frontend

