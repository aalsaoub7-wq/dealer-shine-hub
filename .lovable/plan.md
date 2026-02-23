

# Lägg till "Redigera"-knapp för plattformsuppgifter

## Vad som ändras

**Fil:** `src/components/PlatformSyncDialog.tsx`

### Ändring i platform-raden (rad 684-691)

Lägg till en liten "Redigera"-knapp (penna-ikon) mellan plattformsnamnet och status-badge:n. Knappen visas **bara** om plattformen redan har sparade credentials.

- For Blocket: visas om `hasBlocketCredentials()` returnerar truthy. Klick oeppnar `setShowBlocketSetup(true)` och fyller i formularet med befintliga varden.
- For Wayke: visas om `hasWaykeCredentials()` returnerar truthy. Klick oeppnar `setShowWaykeSetup(true)` och fyller i formularet med befintliga varden.
- For alla andra plattformar (comingSoon): ingen knapp visas.

### Tekniska detaljer

1. Importera `Pencil` fran `lucide-react` (redan installerat).
2. I `platforms.map()`-blocket, efter `<Label>` och fore status-badge-logiken, lagg till:

```tsx
{platform.id === "blocket" && hasBlocketCredentials() && (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7"
    onClick={(e) => {
      e.stopPropagation();
      setBlocketForm({
        blocket_api_token: credentials?.blocket_api_token || "",
        blocket_dealer_code: credentials?.blocket_dealer_code || "",
        blocket_dealer_name: credentials?.blocket_dealer_name || "",
        blocket_dealer_phone: credentials?.blocket_dealer_phone || "",
        blocket_dealer_email: credentials?.blocket_dealer_email || "",
      });
      setShowBlocketSetup(true);
    }}
  >
    <Pencil className="h-3.5 w-3.5" />
  </Button>
)}
{platform.id === "wayke" && hasWaykeCredentials() && (
  <Button
    variant="ghost"
    size="icon"
    className="h-7 w-7"
    onClick={(e) => {
      e.stopPropagation();
      setWaykeForm({
        wayke_client_id: credentials?.wayke_client_id || "",
        wayke_client_secret: credentials?.wayke_client_secret || "",
        wayke_branch_id: credentials?.wayke_branch_id || "",
      });
      setShowWaykeSetup(true);
    }}
  >
    <Pencil className="h-3.5 w-3.5" />
  </Button>
)}
```

### Vad som INTE rors

- Befintlig setup-logik (nar man fyller i credentials forsta gangen)
- Befintliga setup-dialoger for Blocket och Wayke
- Sparfunktioner (`saveBlocketCredentials`, `saveWaykeCredentials`)
- All annan logik i filen
- Inga andra filer

### Riskniva

Extremt lag. Tva villkorliga knappar laggs till i renderingen. Ingen logik andras -- de ateranvander befintliga `setShowBlocketSetup`/`setShowWaykeSetup` och fyller i formularet med redan laddade credentials.

