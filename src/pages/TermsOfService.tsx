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

        <h1 className="text-4xl font-bold mb-8 text-foreground">Användarvillkor</h1>
        
        <div className="prose prose-lg max-w-none text-foreground space-y-6">
          <p className="text-muted-foreground">
            <strong>Senast uppdaterad:</strong> {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Godkännande av villkor</h2>
            <p className="text-muted-foreground">
              Välkommen till Luvero. Genom att registrera dig för, komma åt eller använda vår tjänst 
              godkänner du att vara bunden av dessa användarvillkor. Om du inte godkänner dessa villkor 
              får du inte använda tjänsten.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Beskrivning av tjänsten</h2>
            <p className="text-muted-foreground">
              Luvero är en webbaserad plattform för professionell bilbildsredigering som använder 
              AI-teknologi. Tjänsten erbjuder:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>AI-driven bakgrundsredigering av fordonsbilder</li>
              <li>Gratis lagerhållningssystem för fordonsinventering</li>
              <li>Vattenmärkningsfunktionalitet</li>
              <li>Delningsbara landningssidor för foton</li>
              <li>Teamsamarbete med obegränsat antal användare</li>
              <li>Integration med externa marknadsplatser</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Kontoregistrering och behörighet</h2>
            <p className="text-muted-foreground">
              För att använda tjänsten måste du:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Vara minst 18 år gammal</li>
              <li>Tillhandahålla korrekt och fullständig registreringsinformation</li>
              <li>Upprätthålla säkerheten för ditt konto och lösenord</li>
              <li>Meddela oss omedelbart om obehörig användning av ditt konto</li>
              <li>Företräda ett legitimt företag (för företagskonton)</li>
            </ul>
            <p className="text-muted-foreground">
              Du är ansvarig för all aktivitet som sker under ditt konto.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Priser och betalning</h2>
            <h3 className="text-xl font-semibold text-foreground">4.1 Prissättning</h3>
            <p className="text-muted-foreground">
              <strong>Det som överenskommes vid ert inledande möte med Luvero gällande prissättning och bindningstid är det som gäller för ert avtal.</strong> Alla priser och villkor bestäms individuellt och bekräftas skriftligen i samband med avtalet. Detta inkluderar men är inte begränsat till:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Månadsavgift:</strong> Enligt överenskommelse i ert avtal</li>
              <li><strong>AI-redigering:</strong> Pris per redigerad bild enligt överenskommelse</li>
              <li><strong>Lagerhållning:</strong> Enligt överenskommelse i ert avtal</li>
              <li><strong>Teammedlemmar:</strong> Enligt överenskommelse i ert avtal</li>
            </ul>
            <p className="text-muted-foreground">
              Kontakta oss för ett möte där vi tillsammans går igenom prissättning och villkor anpassade för er verksamhet.
            </p>

            <h3 className="text-xl font-semibold text-foreground">4.2 Bindningstid och uppsägning</h3>
            <p className="text-muted-foreground">
              <strong>Den bindningstid som överenskommes vid ert möte med Luvero är den som gäller.</strong> Du godkänner att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Bindningstid gäller enligt vad som överenskommits vid ert möte och bekräftats i avtalet</li>
              <li>Uppsägning under bindningstiden kan medföra avgifter enligt det överenskomna avtalet</li>
              <li>Uppsägningstid gäller enligt vad som överenskommits vid ert möte</li>
              <li>Du är bunden av de villkor som överenskommits och bekräftats skriftligen</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground">4.3 Fakturering</h3>
            <p className="text-muted-foreground">
              Betalningar hanteras av Stripe. Du godkänner att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Betalningar dras automatiskt enligt faktureringsperiod</li>
              <li>Du ansvarar för alla tillämpliga skatter</li>
              <li>Priser kan ändras med 30 dagars varsel</li>
              <li>Återbetalningar utfärdas endast enligt vår återbetalningspolicy</li>
              <li>Misslyckade betalningar kan resultera i tillfällig avstängning av tjänsten</li>
            </ul>

            <h3 className="text-xl font-semibold text-foreground">4.4 Testperiod</h3>
            <p className="text-muted-foreground">
              Testperiod kan erbjudas enligt överenskommelse. Villkoren för testperioden, inklusive 
              längd och inkluderade funktioner, varierar och specificeras i ditt avtal.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Acceptabel användning</h2>
            <p className="text-muted-foreground">Du får inte använda tjänsten för att:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Överföra olagligt, skadligt eller stötande innehåll</li>
              <li>Kränka andras immateriella rättigheter</li>
              <li>Sprida skadlig kod eller virus</li>
              <li>Försöka få obehörig åtkomst till systemet</li>
              <li>Använda tjänsten för konkurrerande ändamål</li>
              <li>Missbruka eller överbelasta våra servrar</li>
              <li>Kringgå eller manipulera faktureringsmekanismer</li>
              <li>Återförsälja eller distribuera tjänsten utan tillstånd</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Immateriella rättigheter</h2>
            <h3 className="text-xl font-semibold text-foreground">6.1 Våra rättigheter</h3>
            <p className="text-muted-foreground">
              Luvero och dess ursprungliga innehåll, funktioner och funktionalitet ägs av oss och 
              skyddas av internationella upphovsrätts-, varumärkes- och andra immateriella rättigheter.
            </p>

            <h3 className="text-xl font-semibold text-foreground">6.2 Dina rättigheter</h3>
            <p className="text-muted-foreground">
              Du behåller alla äganderätter till de bilder du laddar upp. Genom att använda tjänsten 
              ger du oss en begränsad licens att:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Lagra och bearbeta dina bilder</li>
              <li>Använda AI-teknologi för att redigera dina bilder</li>
              <li>Visa dina bilder tillbaka till dig och dina teammedlemmar</li>
            </ul>
            <p className="text-muted-foreground">
              Vi använder aldrig dina bilder för marknadsföring eller annan användning utan ditt uttryckliga samtycke.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Dataanvändning och integritet</h2>
            <p className="text-muted-foreground">
              Din användning av tjänsten regleras också av vår integritetspolicy. Genom att använda 
              tjänsten samtycker du till vår insamling och användning av dina uppgifter enligt beskrivningen 
              i integritetspolicyn.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Tjänstens tillgänglighet</h2>
            <p className="text-muted-foreground">
              Vi strävar efter att hålla tjänsten tillgänglig 24/7, men vi garanterar inte:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Oavbruten eller felfri åtkomst till tjänsten</li>
              <li>Att fel kommer att korrigeras omedelbart</li>
              <li>Att tjänsten är fri från virus eller skadliga komponenter</li>
            </ul>
            <p className="text-muted-foreground">
              Vi förbehåller oss rätten att tillfälligt eller permanent avbryta tjänsten för underhåll 
              eller uppgraderingar.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Ansvarsbegränsning</h2>
            <p className="text-muted-foreground">
              I den utsträckning som tillåts enligt lag ska Luvero inte vara ansvariga för:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Indirekta, tillfälliga eller följdskador</li>
              <li>Förlust av vinst, data eller goodwill</li>
              <li>Avbrott i verksamheten</li>
              <li>Skador som överstiger det belopp du betalat för tjänsten under de senaste 12 månaderna</li>
            </ul>
            <p className="text-muted-foreground">
              Denna ansvarsbegränsning gäller inte vid vårt grova vårdslöshet eller uppsåt.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Garantifriskrivning</h2>
            <p className="text-muted-foreground">
              Tjänsten tillhandahålls "som den är" och "som tillgänglig" utan garantier av något slag, 
              vare sig uttryckliga eller underförstådda, inklusive men inte begränsat till garantier om 
              säljbarhet, lämplighet för ett visst ändamål eller icke-intrång.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Uppsägning</h2>
            <h3 className="text-xl font-semibold text-foreground">11.1 Av dig</h3>
            <p className="text-muted-foreground">
              Uppsägning av ditt konto måste ske i enlighet med villkoren i ditt specifika avtal. 
              Observera att bindningstid kan gälla och att uppsägning under bindningstiden kan 
              medföra avgifter. Uppsägning träder i kraft enligt vad som anges i ditt avtal.
            </p>

            <h3 className="text-xl font-semibold text-foreground">11.2 Av oss</h3>
            <p className="text-muted-foreground">
              Vi kan säga upp eller stänga av ditt konto omedelbart om:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Du bryter mot dessa villkor</li>
              <li>Du inte betalar fakturor i tid</li>
              <li>Vi avslutar tjänsten (med 30 dagars varsel)</li>
              <li>Det krävs enligt lag</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Ändring av villkor</h2>
            <p className="text-muted-foreground">
              Vi förbehåller oss rätten att när som helst ändra eller ersätta dessa villkor. Om en 
              ändring är väsentlig kommer vi att meddela dig minst 30 dagar innan de nya villkoren 
              träder i kraft. Fortsatt användning av tjänsten efter att ändringar träder i kraft 
              innebär att du accepterar de nya villkoren.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Tvistlösning</h2>
            <p className="text-muted-foreground">
              Dessa villkor regleras av svensk lag. Eventuella tvister ska i första hand lösas genom 
              förhandlingar. Om ingen överenskommelse nås ska tvisten avgöras av svensk domstol.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">14. Övrigt</h2>
            <h3 className="text-xl font-semibold text-foreground">14.1 Hela avtalet</h3>
            <p className="text-muted-foreground">
              Dessa villkor tillsammans med vår integritetspolicy utgör hela avtalet mellan dig och Luvero.
            </p>

            <h3 className="text-xl font-semibold text-foreground">14.2 Överlåtelse</h3>
            <p className="text-muted-foreground">
              Du får inte överlåta eller överföra dina rättigheter enligt dessa villkor utan vårt skriftliga samtycke.
            </p>

            <h3 className="text-xl font-semibold text-foreground">14.3 Avskiljbarhet</h3>
            <p className="text-muted-foreground">
              Om någon bestämmelse i dessa villkor bedöms vara ogiltig ska övriga bestämmelser fortsätta att gälla.
            </p>

            <h3 className="text-xl font-semibold text-foreground">14.4 Force majeure</h3>
            <p className="text-muted-foreground">
              Vi ska inte hållas ansvariga för förseningar eller underlåtenhet att uppfylla våra skyldigheter 
              på grund av omständigheter utanför vår rimliga kontroll.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">15. Kontaktinformation</h2>
            <p className="text-muted-foreground">
              För frågor om dessa användarvillkor, kontakta oss:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li><strong>E-post:</strong> support@luvero.se</li>
              <li><strong>Webbplats:</strong> www.luvero.se</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
