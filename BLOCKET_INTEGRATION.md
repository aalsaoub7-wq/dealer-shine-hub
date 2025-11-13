# Blocket Pro Import API - Integration

Denna plattform är nu integrerad med Blockets Pro Import API v3 för automatisk annonsering av bilar.

## 🎯 Översikt

Plattformen är **source of truth** för bilarna. Allt som skapas/ändras/tas bort här synkas automatiskt till Blocket.

## 📁 Filstruktur

### Backend (Edge Functions)
```
supabase/functions/
├── blocket-sync/
│   └── index.ts              # HTTP-endpoint för sync
└── _shared/blocket/
    ├── blocketClient.ts      # HTTP-wrapper mot Blocket API
    ├── blocketTypes.ts       # TypeScript-typer
    └── blocketSyncService.ts # Huvudlogik för synkning
```

### Frontend
```
src/
├── lib/blocket.ts            # Helper-funktioner
├── hooks/useBlocketSync.ts   # React hook
└── components/BlocketSyncButton.tsx  # UI-komponent
```

### Databas
- **cars**: Utökad med Blocket-fält (price, fuel, gearbox, description, etc.)
- **blocket_ad_sync**: Spårar synkstatus per bil

## 🔐 Konfiguration

### 1. Secrets (redan konfigurerade)
- `BLOCKET_API_TOKEN` - Din Blocket Pro Import API-token ✅

### 2. Valfria Environment Variables
Du kan sätta dessa i Supabase Edge Function secrets för att anpassa annonser:

```bash
BLOCKET_DEALER_CODE=DIN_ÅTERFÖRSÄLJAR_KOD
BLOCKET_DEALER_NAME=Ditt Företagsnamn
BLOCKET_DEALER_PHONE=0701234567
BLOCKET_DEALER_EMAIL=kontakt@dinbilhandel.se
```

Om dessa inte är satta används placeholder-värden.

## 🚀 Hur det fungerar

### Automatisk Synkning

När en bil ändras i plattformen synkas den automatiskt till Blocket om:
- `publish_on_blocket = true`
- `deleted_at IS NULL`

När någon av dessa villkor ändras:
1. **Skapas**: Ny annons skapas på Blocket
2. **Uppdateras**: Befintlig annons uppdateras med nya data
3. **Tas bort**: Annons raderas från Blocket

### Synkflöde

```
1. Bil ändras i DB (cars-tabellen)
   ↓
2. BlocketSyncService.syncCar(carId) anropas
   ↓
3. Hämta bildata + nuvarande synkstatus
   ↓
4. Avgör åtgärd (create/update/delete)
   ↓
5. Anropa Blocket API
   ↓
6. Uppdatera blocket_ad_sync-tabellen
   ↓
7. Hämta och spara loggar från Blocket
```

## 🔌 API-Endpoints

### POST /functions/v1/blocket-sync

Synka en bil till Blocket.

**Request:**
```json
{
  "carId": "uuid-här"
}
```

**Response (success):**
```json
{
  "ok": true,
  "message": "Sync completed",
  "status": {
    "car_id": "...",
    "state": "created",
    "blocket_ad_id": "12345",
    "last_action": "create",
    "last_action_state": "done"
  }
}
```

**Response (error):**
```json
{
  "ok": false,
  "error": "Error message"
}
```

## 💻 Användning i Frontend

### 1. Hook för React-komponenter

```tsx
import { useBlocketSync } from "@/hooks/useBlocketSync";

function MyComponent({ carId, car }) {
  const { 
    status,           // Synkstatus-objekt
    isLoading,        // true när synkning pågår
    syncToBlocket,    // Funktion för att trigga sync
    statusText,       // Formaterad statustext
    isPublished,      // true om bilen är publicerad
    hasError          // true om senaste sync hade fel
  } = useBlocketSync(carId);

  return (
    <div>
      <button onClick={() => syncToBlocket(car)}>
        Synka till Blocket
      </button>
      <p>Status: {statusText}</p>
    </div>
  );
}
```

### 2. Färdig komponent

```tsx
import { BlocketSyncButton } from "@/components/BlocketSyncButton";

function CarDetail({ car }) {
  return (
    <div>
      {/* ... */}
      <BlocketSyncButton carId={car.id} car={car} />
    </div>
  );
}
```

### 3. Direkta helper-funktioner

```tsx
import { 
  syncCarToBlocket,
  getBlocketStatus,
  validateCarForBlocket 
} from "@/lib/blocket";

// Manuell sync
const result = await syncCarToBlocket(carId);

// Hämta status
const status = await getBlocketStatus(carId);

// Validera innan sync
const error = validateCarForBlocket(car);
if (error) {
  alert(error);
}
```

## 🔄 När ska sync köras?

Implementera auto-sync genom att anropa `syncCarToBlocket()` när:

1. **Bil skapas** med `publish_on_blocket = true`
   - Efter `supabase.from('cars').insert()`

2. **Bil uppdateras** (pris, info, bilder)
   - Efter `supabase.from('cars').update()`
   - Om `publish_on_blocket = true`

3. **Bil markeras såld/borttagen**
   - När `deleted_at` sätts
   - När `publish_on_blocket` sätts till `false`

4. **Manuell trigger från UI**
   - Via `<BlocketSyncButton />`

### Exempel: Auto-sync efter uppdatering

```tsx
const handleUpdateCar = async (carId, updates) => {
  // Uppdatera bil
  const { error } = await supabase
    .from('cars')
    .update(updates)
    .eq('id', carId);

  if (error) {
    console.error('Update failed:', error);
    return;
  }

  // Auto-sync till Blocket om bilen är publicerad
  if (updates.publish_on_blocket !== false) {
    await syncCarToBlocket(carId);
  }
};
```

## 📊 Databas-schema

### cars (utökad)
```sql
-- Nya kolumner för Blocket
ALTER TABLE cars ADD COLUMN price integer;
ALTER TABLE cars ADD COLUMN registration_number text;
ALTER TABLE cars ADD COLUMN fuel text;
ALTER TABLE cars ADD COLUMN gearbox text;
ALTER TABLE cars ADD COLUMN description text;
ALTER TABLE cars ADD COLUMN image_urls text[];
ALTER TABLE cars ADD COLUMN publish_on_blocket boolean DEFAULT false;
ALTER TABLE cars ADD COLUMN deleted_at timestamp with time zone;
```

### blocket_ad_sync
```sql
CREATE TABLE blocket_ad_sync (
  car_id uuid PRIMARY KEY REFERENCES cars(id),
  source_id text NOT NULL,
  blocket_ad_id text,
  blocket_store_id text,
  state text CHECK (state IN ('created', 'deleted', 'none')),
  last_action text CHECK (last_action IN ('create', 'update', 'delete', 'bump')),
  last_action_state text CHECK (last_action_state IN ('processing', 'done', 'error')),
  last_error text,
  last_synced_at timestamp with time zone
);
```

## 🔍 Diagnostics & Error Handling

### Visa synkstatus i UI

```tsx
const { status } = useBlocketSync(carId);

if (status?.last_action_state === 'error') {
  return <Alert variant="destructive">{status.last_error}</Alert>;
}

if (status?.state === 'created') {
  return <Badge>Publicerad på Blocket</Badge>;
}
```

### Loggar

Edge function-loggar finns i Lovable Cloud → Backend → Edge Functions → blocket-sync

Sök efter:
- `[BlocketSync]` - Service-loggar
- `[BlocketClient]` - API-anrop

## 🎨 UI-Integration

### I CarDetail-sidan

Lägg till Blocket-fält i formuläret:

```tsx
// Pris
<Input
  type="number"
  value={car.price}
  onChange={(e) => updateCar({ price: parseInt(e.target.value) })}
/>

// Registreringsnummer
<Input
  value={car.registration_number}
  onChange={(e) => updateCar({ registration_number: e.target.value })}
/>

// Publicera på Blocket
<Switch
  checked={car.publish_on_blocket}
  onCheckedChange={(checked) => {
    updateCar({ publish_on_blocket: checked });
    if (checked) syncCarToBlocket(car.id);
  }}
/>

// Synk-knapp
<BlocketSyncButton carId={car.id} car={car} />
```

## 📝 TODO för produktionsdrift

1. ✅ Sätt BLOCKET_API_TOKEN i secrets
2. ⚠️ Sätt rätt BLOCKET_DEALER_CODE (ersätt "DEMO_DEALER")
3. ⚠️ Sätt rätt företagsuppgifter (namn, telefon, email)
4. ⚠️ Lägg till UI-fält för: price, fuel, gearbox, registration_number
5. ⚠️ Implementera auto-sync efter bil-CRUD
6. ⚠️ Testa med riktiga annonser
7. ⚠️ Sätt upp error-notifikationer för admins

## 🔒 Säkerhet

- Edge function kräver **INTE** JWT (verify_jwt = false) för att tillåta webhooks
- RLS-policies på `blocket_ad_sync` säkerställer att användare bara ser sin companys data
- BLOCKET_API_TOKEN lagras säkert i Supabase secrets

## 📚 Blocket API-dokumentation

- Pro Import API v3: https://api.blocket.se/pro-import-api/v3/docs
- Kategorifält för bilar: https://developer.blocket.se/category-fields

## 🆘 Troubleshooting

### "BLOCKET_API_TOKEN saknas"
→ Kontrollera att token är satt i Lovable Cloud → Backend → Secrets

### "Validation failed"
→ Kontrollera att alla obligatoriska fält är ifyllda (make, model, year, price)

### "Ad not found"
→ Annonsen kanske redan är raderad eller har fel source_id

### Sync fungerar inte automatiskt
→ Du måste själv implementera auto-sync genom att anropa `syncCarToBlocket()` efter CRUD-operationer

## 🎯 Nästa steg

1. Lägg till `<BlocketSyncButton />` i `src/pages/CarDetail.tsx`
2. Lägg till price/fuel/gearbox-fält i AddCarDialog
3. Implementera auto-sync efter create/update
4. Testa hela flödet med en testannons
5. Konfigurera rätt dealer-uppgifter
