
## Add toast on successful notes save

### Change — single file: `src/pages/CarDetail.tsx`, line 678

Add one line after `setCar({ ...car, notes: editedNotes });` in `handleSaveNotes`:

```ts
toast({ title: "Sparat", description: "Dina anteckningar har sparats." });
```

`toast` is already imported and used in the same function for errors. No other changes needed.
