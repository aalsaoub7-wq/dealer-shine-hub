

## Fixa WhatsApp-förhandsvisning för delade bildlänkar

### Problemet
Appen är en SPA (Single Page Application) som alltid skickar samma `index.html` till alla besökare. WhatsApp kör inte JavaScript -- den läser bara den rena HTML-koden. Därför ser WhatsApp alltid standardbilden (Luveros `og-image.jpg`) istället för bilderna som delas.

### Lösningen
Skapa en backend-funktion som returnerar en liten HTML-sida med rätt förhandsvisningsdata (bild, titel) när WhatsApp hämtar länken. Vanliga besökare skickas vidare till den riktiga sidan automatiskt.

### Vad som ändras

**1. Ny backend-funktion: `share-preview`**
- Tar emot share-token via URL
- Hämtar kollektionens data från databasen (titel, första bildens URL, logo)
- Returnerar en minimal HTML-sida med korrekta OG-taggar:
  - `og:title` = bilens titel (t.ex. "Volvo XC60 2023")
  - `og:image` = första bilden i kollektionen
  - `og:description` = landing page-beskrivningen eller standardtext
- Sidan innehåller en JavaScript-redirect till `/shared/{token}` så att vanliga besökare hamnar på rätt ställe

**2. Ändring i delningsflödet (CarDetail.tsx)**
- Länken som skapas vid delning pekar på backend-funktionens URL istället för direkt till SPA:n
- Ändring: `shareUrl` byts från `{origin}/shared/{token}` till edge function URL med token som parameter

### Vad som INTE ändras
- SharedPhotos-sidan (den faktiska bildvisningen) -- ingen ändring
- Databasen -- ingen ändring
- Övriga OG-taggar eller SEO -- ingen ändring
- Landningssidan eller andra sidor -- ingen ändring

### Risk
**Mycket låg risk:**
- En ny isolerad backend-funktion som inte påverkar något befintligt
- En liten ändring i URL-genereringen vid delning
- Befintliga delade länkar fortsätter fungera (SPA-routen finns kvar)

### Teknisk detalj

```text
Nuvarande flöde:
  Användare delar --> /shared/abc123 --> WhatsApp hämtar index.html --> fel OG-bild

Nytt flöde:
  Användare delar --> /functions/share-preview?token=abc123
                       |
                       +--> WhatsApp: läser korrekt OG-bild + titel
                       +--> Vanlig besökare: JS-redirect till /shared/abc123
```

