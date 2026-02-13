

# Lägg till kontaktinformation i Blocket-inställningsformuläret

## Ändring

Uppdatera instruktions-texten (DialogDescription) i Blocket-setupformuläret i `PlatformSyncDialog.tsx` så att användaren vet vem de ska kontakta för att få sina uppgifter.

## Vad ändras

**Fil:** `src/components/PlatformSyncDialog.tsx` (rad 379)

Nuvarande text:
> "Ange dina Blocket-uppgifter. Du behöver bara göra detta en gång."

Ny text:
> "Ange dina Blocket-uppgifter. Du behöver bara göra detta en gång. Kontakta Blockets butikssupport (butikssupport@blocket.se) för att få din API-token och dealer-kod."

## Vad ändras INTE

- Inga andra filer eller komponenter
- Ingen logik, inga edge functions, inga databasändringar
- Wayke-formuläret berörs ej

