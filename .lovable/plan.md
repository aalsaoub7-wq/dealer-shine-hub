Uppdatera Blocket-konfigurationsdialogen i `src/components/PlatformSyncDialog.tsx` så att dealer-koden presenteras som obligatorisk istället för valfri.

## Ändringar

1. **Rad 425 (DialogDescription)** — Lägg till en mening som ber användaren be Blocket-supporten om både X-Auth-Token **och dealer-kod (dealer_group)** samtidigt.

2. **Rad 430** — Behåll `X-Auth-Token *`.

3. **Rad 440** — Ändra label från `Dealer-kod (valfritt)` till `Dealer-kod *`.

4. **Rad 443** — Ändra placeholder till t.ex. `Din dealer-kod från Blocket`.

5. **Rad 447–449** — Ändra hjälptexten till att förklara att dealer-koden krävs och fås från Blockets butikssupport tillsammans med token.

Endast textändringar i UI – ingen validering, ingen backend-logik och inga andra filer rörs.
