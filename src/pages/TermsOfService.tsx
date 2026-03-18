import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Användarvillkor | Luvero" 
        description="Läs Luveros användarvillkor för vår AI-drivna bilredigeringstjänst. Information om prissättning, användning, ansvar och dina rättigheter."
        canonicalPath="/anvandarvillkor"
      />
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-8"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>

        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-4xl font-bold mb-4">Användarvillkor för Luvero</h1>
          <p className="text-sm text-muted-foreground mb-8">Senast uppdaterad: 2026-03-18</p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Om villkoren</h2>
            <p>Dessa användarvillkor gäller mellan Luvero och den näringsidkare, det företag eller den organisation som registrerar konto, genomför köp eller använder tjänsten ("Kunden"). Tjänsten är avsedd för företag och andra näringsidkare. Genom att registrera konto, acceptera en Stripe-betalning eller på annat sätt börja använda tjänsten accepterar Kunden dessa användarvillkor och ingår ett bindande avtal med Luvero.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Tjänsten</h2>
            <p>Luvero tillhandahåller en webbaserad B2B-tjänst för professionell bilbildsredigering och relaterade funktioner. Tjänsten kan bland annat omfatta:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>AI-baserad redigering av fordonsbilder,</li>
              <li>lagerhållningsfunktioner för fordonsinventering,</li>
              <li>vattenmärkning,</li>
              <li>delningsbara landningssidor,</li>
              <li>teamfunktioner, och</li>
              <li>integrationer mot externa plattformar och marknadsplatser.</li>
            </ul>
            <p className="mt-4">Tjänstens omfattning, funktioner, begränsningar och pris beror på det abonnemang eller erbjudande som Kunden har köpt.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Avtalspart och behörighet</h2>
            <p>Den person som accepterar dessa villkor eller genomför köp av tjänsten intygar att han eller hon har rätt att företräda Kunden och ingå bindande avtal för Kundens räkning. Kunden ansvarar för att alla uppgifter som lämnas vid registrering eller köp är korrekta och aktuella.</p>
            <p className="mt-4">Kunden ansvarar även för:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>samtliga användare som ges tillgång till kontot,</li>
              <li>att inloggningsuppgifter hanteras säkert, och</li>
              <li>all aktivitet som sker inom ramen för Kundens konto.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Pris och vad som gäller vid köp</h2>
            <p>Det pris som anges i Stripe-betalningen, Stripe-checkouten eller den betalningslänk som Luvero skickar ut är det pris som gäller för avtalet mellan Luvero och Kunden. Genom att genomföra betalningen accepterar Kunden det pris, det faktureringsintervall och den abonnemangsmodell som anges där.</p>
            <p className="mt-4">Om det skulle finnas någon skillnad mellan allmän information på webbplatsen och den aktuella Stripe-betalningen, ska uppgifterna i Stripe-betalningen ha företräde i fråga om pris, abonnemang, faktureringsintervall och betalningsupplägg.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Bindningstid</h2>
            <p>Samtliga abonnemang tecknas med en bindningstid om 12 månader från köpdatum, om inte annat uttryckligen har avtalats skriftligen.</p>
            <p className="mt-4">Under bindningstiden är Kunden betalningsskyldig för hela den avtalade perioden. Uppsägning under bindningstiden medför därför inte att Kundens betalningsskyldighet upphör för återstående del av bindningstiden, annat än om tvingande lag kräver något annat.</p>
            <p className="mt-4">När bindningstiden löpt ut övergår abonnemanget, om inget annat avtalats, till ett löpande månadsabonnemang med 1 månads uppsägningstid.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Fakturering och betalning</h2>
            <p>Betalning sker via Stripe eller annan av Luvero anvisad betallösning. Kunden ansvarar för att det finns giltig betalmetod och tillräcklig täckning för debitering enligt avtalad betalningsplan.</p>
            <p className="mt-4">Luvero har rätt att debitera avgifter enligt det upplägg som framgår av den accepterade Stripe-betalningen, inklusive exempelvis:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>abonnemangsavgift,</li>
              <li>användningsbaserade avgifter, såsom avgift per redigerad bild, och</li>
              <li>andra tilläggstjänster som Kunden väljer att köpa.</li>
            </ul>
            <p className="mt-4">Om en automatisk debitering misslyckas har Luvero rätt att försöka debitera igen, skicka betalningspåminnelse, pausa tjänsten eller begränsa åtkomsten tills full betalning har kommit in.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Sen betalning, dröjsmålsränta och indrivning</h2>
            <p>Om Kunden inte betalar i tid har Luvero rätt till betalning för det förfallna beloppet samt rätt att ta ut följande avgifter och ersättningar i den mån tillämplig lag medger det:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>dröjsmålsränta enligt räntelagen, eller enligt särskilt avtalad dröjsmålsränta,</li>
              <li>påminnelseavgift om 60 kr, under förutsättning att sådan avgift är avtalad, och</li>
              <li>förseningsersättning om 450 kr per faktura i B2B-förhållanden.</li>
            </ul>
            <p className="mt-4">Om ingen särskild dröjsmålsränta har avtalats, har Luvero rätt att ta ut dröjsmålsränta enligt räntelagen. För B2B-fordringar innebär detta i normalfallet referensränta + 8 procentenheter. För perioden 1 januari–30 juni 2026 är referensräntan 2,00 %, vilket innebär en dröjsmålsränta om 10,00 % per år om räntelagens nivå tillämpas.</p>
            <p className="mt-4">Vid fortsatt utebliven betalning har Luvero rätt att lämna fordran vidare till inkasso samt att ansöka om betalningsföreläggande hos Kronofogden. Kunden ansvarar då även för de kostnader och avgifter som kan följa enligt lag och myndighetsbeslut.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Avstängning vid betalningsdröjsmål</h2>
            <p>Luvero har rätt att helt eller delvis stänga av Kundens tillgång till tjänsten vid utebliven betalning, misslyckade debiteringar eller annat betalningsdröjsmål. Sådan avstängning påverkar inte Kundens skyldighet att betala enligt avtalet.</p>
            <p className="mt-4">Luvero har även rätt att hålla inne leverans, support, exportfunktioner, integrationer eller annan åtkomst tills samtliga förfallna belopp, avgifter och räntor har betalats.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Tillåten användning</h2>
            <p>Kunden får inte använda tjänsten på ett sätt som:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>strider mot lag eller myndighetsföreskrift,</li>
              <li>innebär intrång i tredje mans rättigheter,</li>
              <li>sprider skadlig kod, virus eller annan skadlig programvara,</li>
              <li>syftar till att kringgå tekniska begränsningar, säkerhetsfunktioner eller fakturering,</li>
              <li>överbelastar eller stör tjänstens drift, eller</li>
              <li>innebär att tjänsten återförsäljs, kopieras eller kommersialiseras vidare utan Luveros skriftliga godkännande.</li>
            </ul>
            <p className="mt-4">Kunden ansvarar för allt material som laddas upp till tjänsten och för att Kunden har rätt att använda sådant material.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Immateriella rättigheter</h2>
            <p>Alla immateriella rättigheter till tjänsten, inklusive programvara, modeller, design, gränssnitt, varumärken, databaser och dokumentation, tillhör Luvero eller Luveros licensgivare.</p>
            <p className="mt-4">Kunden behåller äganderätten till det material som Kunden laddar upp till tjänsten. Kunden ger dock Luvero en icke-exklusiv rätt att lagra, behandla, analysera, överföra och på annat sätt använda materialet i den utsträckning som krävs för att tillhandahålla tjänsten till Kunden.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Data och integritet</h2>
            <p>I den mån Luvero behandlar personuppgifter sker detta enligt tillämplig dataskyddslagstiftning och Luveros integritetspolicy. Kunden ansvarar för att Kunden har rättslig grund för det material och de personuppgifter som Kunden laddar upp eller behandlar genom tjänsten.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Tillgänglighet och ändringar i tjänsten</h2>
            <p>Luvero strävar efter hög tillgänglighet men garanterar inte att tjänsten alltid är fri från avbrott, fel eller förseningar. Luvero har rätt att uppdatera, ändra eller vidareutveckla tjänsten löpande.</p>
            <p className="mt-4">Luvero har även rätt att tillfälligt stänga ner tjänsten för underhåll, säkerhetsåtgärder, tekniska uppdateringar eller andra affärsmässigt motiverade skäl.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Ansvarsbegränsning</h2>
            <p>Luvero ansvarar inte för indirekt skada, följdskada, utebliven vinst, förlust av data, produktionsbortfall, goodwillförlust eller annan indirekt eller ekonomisk följdförlust.</p>
            <p className="mt-4">Luveros sammanlagda ansvar under ett avtalsår är, i den utsträckning det är tillåtet enligt lag, begränsat till ett belopp motsvarande vad Kunden faktiskt har betalat till Luvero under de senaste 12 månaderna före den skadegörande händelsen.</p>
            <p className="mt-4">Ansvarsbegränsningen gäller inte vid uppsåt eller grov vårdslöshet.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Uppsägning och upphörande</h2>
            <p>Efter bindningstidens utgång kan Kunden säga upp abonnemanget med 1 månads uppsägningstid. Uppsägning ska ske via kundportalen eller skriftligen till Luvero.</p>
            <p className="mt-4">Luvero har rätt att säga upp avtalet eller stänga av tjänsten med omedelbar verkan om:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Kunden bryter mot dessa villkor,</li>
              <li>Kunden är i betalningsdröjsmål,</li>
              <li>Kunden använder tjänsten på ett otillåtet eller skadligt sätt, eller</li>
              <li>Luvero enligt lag, myndighetsbeslut eller säkerhetsskäl måste göra det.</li>
            </ul>
            <p className="mt-4">Om avtalet upphör påverkar detta inte redan uppkommen betalningsskyldighet.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Ändringar av villkoren</h2>
            <p>Luvero har rätt att ändra dessa användarvillkor. Uppdaterade villkor publiceras på Luveros webbplats eller meddelas på annat lämpligt sätt. Om ändringen är väsentlig ska Kunden underrättas i skälig tid innan ändringen träder i kraft.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Tillämplig lag och tvist</h2>
            <p>Dessa villkor ska tolkas och tillämpas enligt svensk lag. Tvist med anledning av dessa villkor eller tjänsten ska avgöras av svensk allmän domstol, med svensk rätt som tillämplig lag.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Övrigt</h2>
            <p>Om någon bestämmelse i dessa villkor skulle anses ogiltig eller inte kunna göras gällande, ska övriga bestämmelser fortsätta att gälla fullt ut.</p>
            <p className="mt-4">Kunden får inte överlåta avtalet utan Luveros skriftliga godkännande. Luvero har rätt att överlåta avtalet till annat bolag inom samma koncern eller i samband med omstrukturering, fusion eller verksamhetsöverlåtelse.</p>
            <p className="mt-4">Luvero ansvarar inte för underlåtenhet att fullgöra viss förpliktelse om detta beror på omständighet utanför Luveros rimliga kontroll, såsom myndighetsbeslut, arbetskonflikt, störningar i el- eller datakommunikation, cyberangrepp eller annan liknande händelse.</p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Kontakt</h2>
            <p>Frågor om dessa användarvillkor skickas till:</p>
            <p className="mt-4">
              E-post: <a href="mailto:support@luvero.se" className="text-primary hover:underline">support@luvero.se</a><br />
              Webbplats: <a href="https://www.luvero.se" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">www.luvero.se</a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
