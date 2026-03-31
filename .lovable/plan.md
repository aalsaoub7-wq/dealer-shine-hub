

# Byt Lucide-ikoner mot 3D-ikoner från 3dicons.co

## Sammanfattning
Ersätt de 6 Lucide SVG-ikonerna i feature-korten med 3D-renderade ikoner från **3dicons.co** (open source, CC0-licens). Ikonerna laddas som `<img>` från deras publika CDN.

## Ikonmappning

| Kort | Lucide-ikon | 3D-ikon | 
|------|-------------|---------|
| 01 AI Bakgrundsredigering | Brain | Painting kit |
| 02 Lagerhantering | Package | Folder |
| 03 Vattenmärken | Shield | Shield (3D) |
| 04 Delningsbara Landningssidor | Globe | Link |
| 05 Team Collaboration | Users | Chat bubble |
| 06 Installera Appen | Download | Mobile |

## Tekniska ändringar

### `src/pages/Landing.tsx`
- Ersätt varje `<Brain className="h-7 w-7 ...">` etc. med `<img src="https://bvconuycpdvgzbvbkijl.supabase.co/storage/v1/object/public/sizes/{id}/dynamic/200/color.webp" alt="..." className="h-10 w-10" />`
- Ta bort oanvända Lucide-imports (Brain, Package, Shield, Globe, Users, Download) om de inte används på andra ställen i filen
- Storleken ökas till `h-10 w-10` för att ge 3D-ikonerna mer plats

## Vad som INTE ändras
- All text, layout, hover-effekter, bento-grid — identiskt
- PWAInstallButton — kvar
- Övriga sektioner — orörda

## Risk
Extremt låg. Byter ut 6 inline SVG-element mot 6 `<img>`-taggar med externa URL:er. Extern CDN-beroende tillkommer (3dicons.co via Supabase storage).

