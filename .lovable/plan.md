
## Plan: Lägg till stöd för inkluderade bilder i Admin

### Nuvarande situation (VERIFIERAD)

Jag har läst igenom alla relevanta filer och bekräftat:

| Fil | Status |
|-----|--------|
| `Admin.tsx` | ✅ Har `monthlyFee` + `pricePerImage` - **saknar** `includedImages` |
| `create-customer-checkout` | ✅ Skapar Stripe subscription med licensed + metered pricing |
| `get-billing-info` | ✅ Hämtar pricing dynamiskt från Stripe |
| `report-usage-to-stripe` | ✅ Rapporterar ALL användning till Stripe meter |
| `PaymentSettings.tsx` | ✅ Visar `totalUsage.editedImages × pricePerImage` |
| `usageTracking.ts` | ✅ Sparar kostnad i `usage_stats` tabellen |

**Problem som måste fixas:**
1. `TrialExpiredPaywall.tsx` säger "Din testperiod har gått ut" - ska ändras till neutral text
2. Inget stöd för inkluderade bilder

---

### Ändringar (6 filer)

| Fil | Ändring |
|-----|---------|
| `src/pages/Admin.tsx` | Lägg till input "Inkluderade bilder/mån" |
| `supabase/functions/create-customer-checkout/index.ts` | Spara `included_images` i subscription metadata |
| `supabase/functions/get-billing-info/index.ts` | Returnera `includedImages` från Stripe metadata |
| `supabase/functions/report-usage-to-stripe/index.ts` | Skippa rapportering om inom inkluderad kvot |
| `src/components/PaymentSettings.tsx` | Visa "X inkluderade" + "Överskridande" |
| `src/components/TrialExpiredPaywall.tsx` | Ändra text till "Konto ej aktiverat" |

---

### Steg 1: Admin.tsx - Lägg till fält

Rad ~62 - ny state:
```typescript
const [includedImages, setIncludedImages] = useState("0");
```

Efter `pricePerImage` input - nytt fält:
```tsx
<div className="space-y-2">
  <Label htmlFor="includedImages">Inkluderade bilder/mån</Label>
  <Input
    id="includedImages"
    type="number"
    placeholder="0 = betala per bild"
    value={includedImages}
    onChange={(e) => setIncludedImages(e.target.value)}
  />
  <p className="text-xs text-muted-foreground">
    0 = betala för varje bild. Annars ingår X bilder, överskridande debiteras per bild.
  </p>
</div>
```

Rad ~308-312 - skicka med i body:
```typescript
body: {
  companyName: companyName.trim(),
  monthlyFee: Math.round(monthlyFeeNum * 100),
  pricePerImage: Math.round(pricePerImageNum * 100),
  includedImages: parseInt(includedImages) || 0  // NY
}
```

---

### Steg 2: create-customer-checkout - Spara metadata

Rad ~48 - ta emot parameter:
```typescript
const { companyName, monthlyFee, pricePerImage, includedImages = 0 } = await req.json();
```

Rad ~146-151 - lägg till i subscription_data.metadata:
```typescript
subscription_data: {
  metadata: {
    company_name: companyName,
    product_id: product.id,
    included_images: String(includedImages),  // NY
  },
},
```

---

### Steg 3: get-billing-info - Returnera includedImages

I `getDynamicPricing` funktionen (rad ~107):
```typescript
const getDynamicPricing = async (stripeSubscriptionId: string) => {
  const stripeSubscription = await stripe.subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['items.data.price'],
  });

  // NY: Hämta included_images
  const includedImages = parseInt(stripeSubscription.metadata?.included_images || "0");
  
  // ... befintlig logik för monthlyFee och pricePerImage ...
  
  return {
    name: planName,
    monthlyFee,
    pricePerImage,
    includedImages,  // NY
    color: 'primary',
  };
};
```

---

### Steg 4: report-usage-to-stripe - Smart rapportering

Efter rad ~109 (efter `const subscription = subscriptions.data[0]`):

```typescript
// Hämta included_images från subscription metadata
const includedImages = parseInt(subscription.metadata?.included_images || "0");

if (includedImages > 0) {
  // Räkna bilder för hela företaget denna månad
  const currentDate = new Date();
  const firstDayOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;
  
  // Hämta alla användare i företaget
  const { data: companyUsers } = await supabase
    .from("user_companies")
    .select("user_id")
    .eq("company_id", userCompany.company_id);
  
  const userIds = (companyUsers || []).map(u => u.user_id);
  
  // Hämta total användning
  const { data: usageStats } = await supabase
    .from("usage_stats")
    .select("edited_images_count")
    .in("user_id", userIds)
    .eq("month", firstDayOfMonth);
  
  const totalUsedThisMonth = (usageStats || []).reduce((sum, s) => sum + (s.edited_images_count || 0), 0);
  
  // Om inom gränsen - skippa Stripe
  if (totalUsedThisMonth <= includedImages) {
    console.log(`[REPORT-USAGE] Image ${totalUsedThisMonth}/${includedImages} - within limit, skipping Stripe`);
    return new Response(JSON.stringify({ 
      success: true,
      skipped: true,
      reason: `Within included images (${totalUsedThisMonth}/${includedImages})`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
  
  console.log(`[REPORT-USAGE] Image ${totalUsedThisMonth}/${includedImages} - OVER limit, reporting`);
}

// Fortsätt med befintlig Stripe-rapportering...
```

---

### Steg 5: PaymentSettings.tsx - Visa korrekt räknare

Uppdatera PlanConfig interface (rad ~13):
```typescript
interface PlanConfig {
  name: string;
  monthlyFee: number;
  pricePerImage: number;
  includedImages?: number;  // NY
  color: string;
}
```

Innan return (rad ~164):
```typescript
const includedImages = planConfig.includedImages || 0;
const imagesWithinLimit = Math.min(totalUsage.editedImages, includedImages);
const overageImages = Math.max(0, totalUsage.editedImages - includedImages);
const overageCost = overageImages * planConfig.pricePerImage;
```

Ersätt "Redigerade bilder (totalt)" sektionen (rad ~352-362):
```tsx
{includedImages > 0 ? (
  <>
    {/* Inkluderade bilder */}
    <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10 border border-green-500/20">
      <div>
        <span className="font-medium">Inkluderade bilder</span>
        <p className="text-xs text-muted-foreground">
          {imagesWithinLimit} av {includedImages} använda
        </p>
      </div>
      <span className="text-xl font-bold text-green-500">0 kr</span>
    </div>
    
    {overageImages > 0 && (
      <div className="flex items-center justify-between p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
        <div>
          <span className="font-medium">Överskridande bilder</span>
          <p className="text-xs text-muted-foreground">
            {overageImages} × {planConfig.pricePerImage} kr
          </p>
        </div>
        <span className="text-xl font-bold text-amber-500">{overageCost.toFixed(2)} kr</span>
      </div>
    )}
  </>
) : (
  // Nuvarande visning för pay-per-image
  <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
    <div>
      <span className="font-medium">Redigerade bilder (totalt)</span>
      <p className="text-xs text-muted-foreground">
        {totalUsage.editedImages} × {planConfig.pricePerImage} kr
      </p>
    </div>
    <span className="text-xl font-bold">{totalUsage.cost.toFixed(2)} kr</span>
  </div>
)}
```

Uppdatera total kostnad (rad ~367-368):
```tsx
const displayCost = includedImages > 0 ? overageCost : totalUsage.cost;
// Använd displayCost istället för totalUsage.cost i beräkningen
```

---

### Steg 6: TrialExpiredPaywall.tsx - Ta bort trial-text

Ändra text (rad ~173-177):
```tsx
<h1 className="text-2xl font-bold text-foreground">
  Konto ej aktiverat
</h1>
<p className="text-muted-foreground">
  Kontakta oss för att aktivera ditt konto
</p>
```

---

### Varför detta är LOW RISK

| Kontroll | Status |
|----------|--------|
| Befintliga kunder påverkas inte | ✅ `included_images` saknas = 0 = nuvarande beteende |
| Databasändring krävs | ❌ Ingen - data i Stripe metadata |
| Edge functions backwards compatible | ✅ `parseInt("0")` fallback |
| UI fallback | ✅ `includedImages \|\| 0` |
| Stripe-flödet intakt | ✅ Samma licensed + metered modell |
| Ingen "trial/Start/Pro/Elit" text | ✅ Verifierat borttaget |

---

### Hur det fungerar i praktiken

**Admin skapar kund A (pay-per-image):**
- Månadsavgift: 2990 kr
- Pris per bild: 10 kr  
- Inkluderade: 0

→ Alla bilder rapporteras till Stripe
→ PaymentSettings visar: "50 bilder × 10 kr = 500 kr"

**Admin skapar kund B (inkluderade bilder):**
- Månadsavgift: 2990 kr
- Pris per bild: 10 kr
- Inkluderade: 200

→ Bild 1-200: Skippas i Stripe-rapportering
→ Bild 201+: Rapporteras till Stripe
→ PaymentSettings visar:
  - "Inkluderade: 150/200 använda = 0 kr"
  - (eller om över)
  - "Inkluderade: 200/200 använda = 0 kr"
  - "Överskridande: 15 × 10 kr = 150 kr"
