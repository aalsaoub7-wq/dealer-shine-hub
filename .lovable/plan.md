

# Fixa bildklick på iPhone

## Problem
Två saker blockerar bildklick på mobil:

1. Bildklick är medvetet avstängt på mobil (rad 101: `!isMobile && onImageClick(...)`) för att undvika oavsiktliga klick vid scroll
2. Knapparna (Maximera, Radera, etc.) är dolda bakom `md:group-hover:opacity-100` -- men på mobil triggas aldrig `md:group-hover`, så knapparna syns ALDRIG

Resultat: det finns inget sätt att öppna en bild på mobil.

## Lösning
Gör knapparna alltid synliga på mobil, men behåll hover-beteendet på desktop. Bildklick via att trycka direkt på bilden förblir avstängt på mobil (det var medvetet för att undvika scroll-problem).

## Ändring -- 1 fil: `src/components/PhotoGalleryDraggable.tsx`

### Rad 144: Ändra opacity-klassen för action buttons
Från:
```
opacity-0 md:group-hover:opacity-100
```
Till:
```
opacity-100 md:opacity-0 md:group-hover:opacity-100
```

Detta gör att:
- **Mobil**: Knapparna (Maximera, Radera, Redigera) syns alltid
- **Desktop**: Knapparna är dolda och visas vid hover, precis som innan

### Vad som INTE ändras
- Bildklick via att trycka på själva bilden (förblir avstängt på mobil, det var medvetet)
- Checkbox-logik
- Drag-and-drop
- Desktop-upplevelsen
- Inga andra filer
