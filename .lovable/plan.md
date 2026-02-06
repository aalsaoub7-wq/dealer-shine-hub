

## Fix: Deploya om ALLA backend-funktioner

### Problem
Alla backend-funktioner har fallit ur deployment (returnerar 404). Detta orsakar:
1. **"Konto ej aktiverat"** -- `get-billing-info` svarar inte, och appen tolkar det som att betalningen saknas
2. **Dela-länken fungerar inte** -- `share-preview` returnerar 404

### Rotorsak
Under senaste ändringarna av share-preview har samtliga edge-funktioner tappats ur deployment.

### Vad som behöver göras

**Steg 1: Deploya om ALLA 27 edge-funktioner**

Samtliga funktioner deployeras i ett svep:
- add-reflection
- blocket-sync
- check-admin-ip
- create-background-template
- create-customer-checkout
- create-initial-stripe-customer
- create-stripe-customer
- customer-portal
- delete-account
- edit-photo
- generate-car-description
- get-admin-customers
- get-billing-info
- get-verification-status
- init-templates
- manage-leads
- remove-logo-background
- report-usage-to-stripe
- request-password-reset
- reset-password
- save-admin-ip
- segment-car
- send-email-verification
- send-phone-otp
- share-preview
- stripe-webhook
- track-trial-usage
- translate-text
- trigger-auto-stripe-customer
- verify-code

**Steg 2: Verifiera kritiska funktioner**
- Testa `get-billing-info` -- detta fixar "Konto ej aktiverat"-problemet
- Testa `share-preview` -- detta fixar delningslänkarna

### Vad som INTE ändras
- Ingen kod ändras -- alla filer är korrekta
- Ingen databas ändras
- Ingen frontend-kod ändras

### Risk
Ingen -- funktionernas kod har inte ändrats, de behöver bara deployas om.
