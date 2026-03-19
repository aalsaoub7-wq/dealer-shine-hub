

# Fixa bildnedladdning till Kamerarullen på iOS PWA

## Problem
På iOS PWA fungerar inte `<a download>` — bilder hamnar i Filer-appen istället för Kamerarullen/Foton. Detta är en känd iOS-begränsning.

## Lösning
Använd `navigator.share({ files: [imageFile] })` på iOS istället för `<a download>`. Web Share API Level 2 (stöds på iOS 15+) visar delningsmenyn där "Spara bild" sparar direkt till Foton/Kamerarullen.

## Ändring

**Enda fil:** `src/pages/CarDetail.tsx`, funktionen `handleDownloadPhotos` (rad 439–460)

Ändra loopen i funktionen:
1. Detektera om vi är på iOS (via `navigator.userAgent`)
2. **iOS**: Skapa en `File` från bloben och anropa `navigator.share({ files: [file] })` — detta öppnar delningsmenyn med "Spara bild"-alternativet
3. **Övriga plattformar**: Behåll befintlig `<a download>`-logik exakt som den är

```text
// Pseudokod för ändringen
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

for (const photo of photosToDownload) {
  const response = await fetch(photo.url);
  const blob = await response.blob();
  
  if (isIOS && navigator.canShare) {
    const file = new File([blob], `photo-${photo.id}.jpg`, { type: blob.type });
    if (navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file] });
      continue;
    }
  }
  
  // Fallback: befintlig <a download>-logik (orörd)
  const downloadUrl = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  // ... samma som idag
}
```

## Risk
Extremt låg. Rent additivt — lägger till en iOS-specifik gren före befintlig logik. Icke-iOS-enheter påverkas inte alls. Om `canShare` inte stöds faller det tillbaka till befintlig logik.

