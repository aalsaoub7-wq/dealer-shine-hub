## Problem

I PWA/web-läget på mobil tvingar uppladdningsdialogen kameran, eftersom `<input type="file" capture="environment">` på iOS/Android öppnar kameran direkt och hindrar val från galleri/filer.

Filen: `src/components/PhotoUpload.tsx` (rad ~346–369, web/PWA-grenen).

## Lösning (minimal, endast PWA/web-grenen)

Ersätt den enda inputen med två knappar — samma mönster som native-grenen redan har:

1. **"Ta foto"** — `<input type="file" accept="image/*" capture="environment" multiple>` (öppnar kamera på mobil).
2. **"Välj från galleri/filer"** — `<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,image/avif" multiple>` (utan `capture` → öppnar systemets fil-/bildväljare; på iOS/Android visas både galleri och filer).

Båda inputs är dolda och triggas via knappar, så desktop-användare ser samma "Välj filer"-flöde och får standard-fildialogen (kamera-knappen är ofarlig på desktop — inputen ignorerar `capture` där).

Befintlig `handleFileSelect` återanvänds för båda inputs. Ingen ändring i upload-logik, native-grenen, billing, edge functions eller DB.

## Out of scope

- Native (Capacitor) flödet — orört.
- Andra dialoger (interior, watermark, admin background upload).
- Validering, storleksgräns, AVIF-konvertering — orört.

## Validering

- Desktop: dialog visar två knappar; "Välj från galleri/filer" öppnar fildialog och flera filer kan väljas.
- Mobil PWA (iOS Safari + Android Chrome): "Ta foto" → kamera, "Välj från galleri/filer" → bildväljare med möjlighet att välja flera bilder från rullen/filer.
- Uppladdning fungerar som tidigare (samma `handleFileSelect`).
