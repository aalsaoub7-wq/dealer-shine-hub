

# Fix: iOS laddar bara ner första bilden

## Problem
`navigator.share()` öppnar iOS delningsmenyn som kräver användarinteraktion. I en loop anropas den en gång per bild — efter första bilden avbryter iOS resten (användaren måste interagera med varje share sheet, och efterföljande anrop blockeras/kastas som error).

## Lösning
Samla ALLA filer först, skicka sedan ett enda `navigator.share({ files: allFiles })` med alla bilder på en gång. iOS share sheet visar då alla bilder och "Spara X bilder" sparar alla till Kamerarullen.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`, `handleDownloadPhotos` (rad 439–473)

Ändra iOS-grenen:
1. Fetcha alla blobs först i en loop
2. Skapa en `File[]`-array med alla bilder
3. Anropa `navigator.share({ files })` EN gång med hela arrayen
4. Fallback (icke-iOS) förblir orörd

```text
// Ny iOS-logik (pseudokod)
if (isIOS && navigator.canShare) {
  const files: File[] = [];
  for (const photo of photosToDownload) {
    const response = await fetch(photo.url);
    const blob = await response.blob();
    files.push(new File([blob], `photo-${photo.id}.png`, { type: blob.type || 'image/png' }));
  }
  if (files.length > 0 && navigator.canShare({ files })) {
    await navigator.share({ files });
    // Klart — alla bilder i ett anrop
    return;
  }
}

// Fallback: befintlig <a download>-loop (orörd)
```

## Risk
Extremt låg. Samma API, bara ett anrop istället för N. Icke-iOS orörd.

