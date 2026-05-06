
## Add "Skadebilder" tab to CarDetail

Add a third tab alongside "Huvudfoton" and "Dokumentation" for damage photos, using `photo_type: "damage"`.

### Changes — single file: `src/pages/CarDetail.tsx`

1. **Import `Wrench` icon** — add to the existing lucide-react import (line 8-25).

2. **Add state** for damage photo selection:
   - `const [selectedDamagePhotos, setSelectedDamagePhotos] = useState<string[]>([]);`
   - Add `damagePhotos` filter: `photos.filter(p => p.photo_type === "damage")`

3. **Add TabsTrigger** (after the Dokumentation trigger, line ~2170):
   ```tsx
   <TabsTrigger value="damage" className="...same classes...">
     <Wrench className="w-3.5 h-3.5 md:w-4 md:h-4 mr-1 md:mr-2" />
     <span className="hidden xs:inline">Skadebilder</span> ({damagePhotos.length})
   </TabsTrigger>
   ```

4. **Add TabsContent** (after the docs TabsContent, line ~2354):
   ```tsx
   <TabsContent value="damage" className="space-y-4 md:space-y-6">
     <div className="h-8 pointer-events-none" />
     <PhotoGalleryDraggable
       photos={damagePhotos}
       onUpdate={() => fetchCarData(true)}
       selectedPhotos={selectedDamagePhotos}
       onSelectionChange={setSelectedDamagePhotos}
       onRemoveWatermark={handleRemoveWatermark}
       onAdjustWatermark={handleOpenWatermarkEditor}
       onDragStart={() => { isDraggingPhotosRef.current = true; }}
       onReorderComplete={() => { isDraggingPhotosRef.current = false; }}
     />
   </TabsContent>
   ```

5. **Extend toolbar logic** for the damage tab:
   - Select all / deselect all button: add `damage` case alongside `main`/`docs`
   - Transfer button: support transferring from/to damage tab
   - Upload button: set `uploadType` to `"damage"` when on damage tab
   - Watermark bulk action: add damage tab support

6. **Update `uploadType` state type** to include `"damage"`: `useState<"main" | "documentation" | "damage">("main")`

### No migration needed
`photo_type` is a plain `string` column — no enum constraint. Adding `"damage"` as a value works immediately.

### Impact analysis
- **Main photos tab**: Unchanged — still filters `photo_type === "main"`
- **Documentation tab**: Unchanged — still filters `photo_type === "documentation"`
- **Upload flow**: Only affected by adding "damage" as a valid upload type
- **AI editing, position editor, watermark, platform sync**: All operate on individual photos by ID — unaffected
- **Drag & drop reorder**: Uses same PhotoGalleryDraggable component — works identically
- **No other files modified**
