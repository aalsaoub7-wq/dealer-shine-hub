

# Förbättra iOS PWA-installationsinstruktionen

## Problem
Texten "Dela -> Lägg till på hemskärmen" är otydlig. Användare förstår inte var dela-knappen finns eller att det är en manuell process i Safari.

## Lösning
Ersätt den korta textraden med en tydlig steg-för-steg-guide som visas i en popup/dialog när man klickar på en knapp.

## Ändringar -- 1 fil: `src/components/PWAInstallButton.tsx`

### Ny upplevelse för iOS-användare
Istället för den kryptiska texten, visa en **knapp** som öppnar en **dialog** med tydliga steg:

**Knappen:** "Så installerar du på iPhone" (klickbar)

**Dialogen innehåller:**
1. Rubrik: "Installera Luvero på iPhone"
2. Steg 1: "Öppna luvero.se i **Safari**" (med Safari-ikon)
3. Steg 2: "Tryck på **dela-ikonen** i verktygsfältet" (visa den faktiska ikonen -- fyrkant med pil uppåt)
4. Steg 3: "Scrolla ner och tryck **Lägg till på hemskärmen**"
5. Steg 4: "Klart! Appen finns nu på din hemskärm"

### Tekniska detaljer
- Använd befintlig `Dialog`-komponent från `@radix-ui/react-dialog` (redan installerad)
- Ikoner: `Share`, `Plus`, `Smartphone` från `lucide-react`
- Uppdatera både `variant="button"` och `variant="link"` för iOS-fallet
- Knappen i link-varianten blir en klickbar text som öppnar samma dialog
- Ingen ny fil behövs, allt ryms i `PWAInstallButton.tsx`

### Vad som INTE ändras
- Android/Chrome install-logik (canInstall)
- usePWAInstall hook
- PWAInstallPrompt komponent
- Landing page layout
- Allt annat i appen
