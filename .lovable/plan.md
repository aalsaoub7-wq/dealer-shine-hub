

# Stäng upload-popup direkt vid klick på "Ladda upp"

## Vad som ändras

**Enda fil:** `src/components/PhotoUpload.tsx`

**Enda ändring:** Flytta `onOpenChange(false)` och `setSelectedFiles([])` från rad 286–287 (efter alla uploads är klara) till direkt efter rad 197 (efter placeholders skapats och `onUploadComplete()` anropats).

Detta gör att dialogen stängs omedelbart efter att placeholder-kort med spinners dykt upp på sidan, medan själva filuppladdningen fortsätter i bakgrunden — exakt det beteende som redan syns bakom popupen idag.

## Teknisk detalj

```text
Före:
  1. Skapa placeholders → onUploadComplete()
  2. Ladda upp alla filer (dialog öppen, knapp visar "Bearbetar...")
  3. onUploadComplete() → stäng dialog

Efter:
  1. Skapa placeholders → onUploadComplete() → stäng dialog
  2. Ladda upp alla filer i bakgrunden
  3. onUploadComplete()
```

Rad 286–287 (`onOpenChange(false); setSelectedFiles([]);`) tas bort och läggs in direkt efter rad 197. Inget annat ändras.

## Risk
Ingen. Uploads fortsätter asynkront som innan. Placeholder-spinners syns direkt på sidan.

