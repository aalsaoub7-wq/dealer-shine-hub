import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
const PrivacyPolicy = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Tillbaka
        </Button>

        <h1 className="text-4xl font-bold mb-8 text-foreground">Integritetspolicy</h1>
        
        <div className="prose prose-lg max-w-none text-foreground space-y-6">
          <p className="text-muted-foreground">
            <strong>Senast uppdaterad:</strong> {new Date().toLocaleDateString('sv-SE')}
          </p>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">1. Inledning</h2>
            <p className="text-muted-foreground">
              Välkommen till Luvero. Vi värnar om din integritet och är engagerade i att skydda dina personuppgifter. 
              Denna integritetspolicy förklarar hur vi samlar in, använder, lagrar och skyddar din information när du 
              använder vår tjänst för professionell bilbildsredigering.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">2. Personuppgiftsansvarig</h2>
            <p className="text-muted-foreground">
              Luvero är personuppgiftsansvarig för behandlingen av dina personuppgifter. För frågor om denna policy, kontakta oss på: admin@luvero.se
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">3. Vilka uppgifter samlar vi in?</h2>
            <p className="text-muted-foreground">Vi samlar in följande typer av information:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Kontoinformation:</strong> E-postadress, företagsnamn, användarroll</li>
              <li><strong>Bildata:</strong> Uppladdade bilbilder och registreringsnummer för fordon</li>
              <li><strong>Användningsdata:</strong> Information om hur du använder tjänsten, inklusive antal redigerade bilder</li>
              <li><strong>Betalningsinformation:</strong> Stripe hanterar all betalningsinformation säkert (vi lagrar aldrig kortuppgifter)</li>
              <li><strong>Teknisk data:</strong> IP-adress, webbläsartyp, enhetstyp och användarstatistik</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">4. Hur använder vi dina uppgifter?</h2>
            <p className="text-muted-foreground">Vi använder dina personuppgifter för att:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Tillhandahålla och underhålla vår tjänst</li>
              <li>Bearbeta och redigera dina uppladdade bilder med AI-teknologi</li>
              <li>Hantera ditt konto och autentisering</li>
              <li>Behandla betalningar och fakturering</li>
              <li>Skicka viktiga meddelanden om tjänsten</li>
              <li>Förbättra och utveckla våra tjänster</li>
              <li>Uppfylla juridiska skyldigheter</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">5. Rättslig grund för behandling</h2>
            <p className="text-muted-foreground">
              Vi behandlar dina personuppgifter baserat på följande rättsliga grunder:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Avtalsuppfyllelse:</strong> För att tillhandahålla tjänsten du har registrerat dig för</li>
              <li><strong>Samtycke:</strong> När du godkänner specifika användningsområden</li>
              <li><strong>Berättigat intresse:</strong> För att förbättra och säkra vår tjänst</li>
              <li><strong>Juridisk förpliktelse:</strong> För att uppfylla bokföringskrav och andra lagkrav</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">6. Delning av uppgifter</h2>
            <p className="text-muted-foreground">Vi delar dina uppgifter endast med:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Stripe:</strong> För betalningshantering och fakturering</li>
              <li><strong>AI-tjänstleverantörer:</strong> För bildredigering (bilder raderas efter bearbetning)</li>
              <li><strong>Molnlagringstjänster:</strong> För säker lagring av data (Supabase/AWS)</li>
              <li><strong>Juridiska myndigheter:</strong> När det krävs enligt lag</li>
            </ul>
            <p className="text-muted-foreground">
              Vi säljer aldrig dina personuppgifter till tredje part.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">7. Lagring av uppgifter</h2>
            <p className="text-muted-foreground">
              Vi lagrar dina personuppgifter så länge ditt konto är aktivt eller så länge det behövs för att 
              tillhandahålla tjänsten. Bilder som laddas upp för redigering lagras enligt följande:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Original- och redigerade bilder: Lagras tills du raderar dem eller avslutar ditt konto</li>
              <li>AI-bearbetningsdata: Raderas automatiskt efter att redigeringen är klar</li>
              <li>Faktureringsdata: Lagras enligt bokföringslagens krav (7 år)</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">8. Dina rättigheter enligt GDPR</h2>
            <p className="text-muted-foreground">Du har rätt att:</p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Tillgång:</strong> Begära en kopia av dina personuppgifter</li>
              <li><strong>Rättelse:</strong> Korrigera felaktiga eller ofullständiga uppgifter</li>
              <li><strong>Radering:</strong> Begära att vi raderar dina uppgifter ("rätten att bli glömd")</li>
              <li><strong>Begränsning:</strong> Begära att vi begränsar behandlingen av dina uppgifter</li>
              <li><strong>Dataportabilitet:</strong> Få dina uppgifter i ett strukturerat, maskinläsbart format</li>
              <li><strong>Invändning:</strong> Invända mot behandling baserad på berättigat intresse</li>
              <li><strong>Återkalla samtycke:</strong> När som helst återkalla ditt samtycke</li>
            </ul>
            <p className="text-muted-foreground">
              För att utöva dessa rättigheter, kontakta oss på support@luvero.se
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">9. Säkerhet</h2>
            <p className="text-muted-foreground">
              Vi använder branschstandardiserade säkerhetsåtgärder för att skydda dina uppgifter:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>SSL/TLS-kryptering för all dataöverföring</li>
              <li>Krypterad datalagring</li>
              <li>Säker autentisering och behörighetskontroll</li>
              <li>Regelbundna säkerhetsgranskningar</li>
              <li>Begränsad åtkomst till personuppgifter</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">10. Cookies och spårning</h2>
            <p className="text-muted-foreground">
              Vi använder nödvändiga cookies för att tjänsten ska fungera korrekt, inklusive:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Autentiseringscookies för att hålla dig inloggad</li>
              <li>Sessionscookies för att hantera din användarsession</li>
              <li>Preferenscookies för att komma ihåg dina inställningar</li>
            </ul>
            <p className="text-muted-foreground">
              Vi använder inte tredjepartscookies för marknadsföring eller spårning.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">11. Barn</h2>
            <p className="text-muted-foreground">
              Vår tjänst är endast avsedd för företagsanvändning och inte för barn under 16 år. 
              Vi samlar inte medvetet in personuppgifter från barn.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">12. Internationella överföringar</h2>
            <p className="text-muted-foreground">
              Dina uppgifter kan överföras till och lagras i länder utanför EU/EES. 
              Vi säkerställer att sådana överföringar sker i enlighet med GDPR genom användning av 
              standardavtalsklausuler eller andra lämpliga skyddsåtgärder.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">13. Ändringar i integritetspolicyn</h2>
            <p className="text-muted-foreground">
              Vi kan uppdatera denna integritetspolicy från tid till annan. Vi kommer att meddela dig om 
              väsentliga ändringar via e-post eller genom ett meddelande i tjänsten. Den senaste versionen 
              finns alltid tillgänglig på denna sida.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">14. Kontakta oss</h2>
            <p className="text-muted-foreground">
              För frågor om denna integritetspolicy eller hur vi hanterar dina personuppgifter, kontakta oss:
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li><strong>E-post:</strong>E-post: admin@luvero.se</li>
              <li><strong>Webbplats:</strong> www.luvero.se</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-foreground">15. Klagomål till tillsynsmyndighet</h2>
            <p className="text-muted-foreground">
              Om du anser att vi behandlar dina personuppgifter på ett felaktigt sätt har du rätt att 
              lämna in ett klagomål till Integritetsskyddsmyndigheten (IMY):
            </p>
            <ul className="list-none space-y-2 text-muted-foreground">
              <li><strong>Webbplats:</strong>Webbplats: www.luvero.se</li>
              <li><strong>E-post:</strong> admin@luvero.se</li>
              <li><strong>Telefon:</strong>Telefon: 076-212 37 86</li>
            </ul>
          </section>
        </div>
      </div>
    </div>;
};
export default PrivacyPolicy;