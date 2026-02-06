

## Byt ut reflection-prompten (1 fil, 1 rad)

### Vad som andras

**`supabase/functions/add-reflection/index.ts`** — rad 66

Nuvarande prompt:
```
"This is a high-resolution professional car dealership photo (2560x1707 pixels, 3:2 aspect ratio). Add a subtle soft and fading mirror-like reflection of the vehicle on the polished showroom floor beneath it. Keep all other elements unchanged - maintain the exact same car, background, lighting, and resolution. Only add the floor reflection effect. Output the image at the same 2K resolution."
```

Ny prompt (verbatim):
```
"This is a high-resolution professional car dealership photo (2560x1707 pixels, 3:2 aspect ratio). Add a subtle soft and fading mirror-like reflection of the vehicle on the polished showroom floor beneath it. Keep all other elements unchanged - maintain the exact same car, background, lighting, and resolution. Only add the floor reflection effect. Output the image at the same 2K resolution. The mirror like reflection should be of only the bottom half of the car, and it should be FADING, so it looks natural. Meaning, the reflection at the beginning should be clear, and then fade the higher up it is on the car and it should be suitable with the ground. Fix this."
```

### Inget annat andras

- Samma modell (`google/gemini-3-pro-image-preview`)
- Samma konfiguration (aspect ratio, output size)
- Samma uppladdningslogik, DB-uppdatering, felhantering
- Bara textstrangens innehall pa rad 66 byts ut

### Risk

**Ingen** — enda andringen ar textinnehallet i prompten. All logik ar identisk.

