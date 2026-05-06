## Ändring

Alla bildväljare i PlatformSyncDialog startar idag med **alla bilder markerade**. Ändringen gör att de istället startar **tomma**, så användaren själv väljer vilka bilder som ska skickas.

## Teknisk detalj

**Fil:** `src/components/PlatformSyncDialog.tsx`

Byt `mainPhotos.map(p => p.url)` till `[]` på 4 ställen:
- Rad 201: `setSelectedBlocketImages([])`
- Rad 236: `setSelectedWaykeImages([])`
- Rad 253: `setSelectedBlocketImages([])`
- Rad 263: `setSelectedWaykeImages([])`

Inget annat påverkas — bara initialvärdet ändras.