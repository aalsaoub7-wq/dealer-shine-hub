import { ArrowLeft, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
const Documentation = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-8 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka till startsidan
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <BookOpen className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-bold text-foreground">Dokumentation</h1>
        </div>

        <p className="text-lg text-muted-foreground mb-8">
          Välkommen till Luveros dokumentation. Här hittar du allt du behöver veta för att komma igång och få ut det mesta av appen.
        </p>

        <Accordion type="single" collapsible className="space-y-4">
          {/* Komma igång */}
          <AccordionItem value="getting-started" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              🚀 Komma igång
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Registrera konto</h4>
                <p>
                  Klicka på "Prova gratis i 21 dagar" på startsidan. Du kan registrera dig med e-post och lösenord eller via Google. 
                  Under testperioden (21 dagar) kan du använda alla funktioner helt gratis, inklusive upp till 50 AI-redigerade bilder.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Första inloggningen</h4>
                <p>
                  Efter registrering kommer du till din Dashboard där du ser en översikt av alla dina bilar. 
                  Dashboarden visar antalet bilar i ditt lager och ger dig snabb tillgång till att lägga till nya bilar.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Navigering</h4>
                <p>
                  I toppmenyn hittar du "Lägg till bil" för att skapa nya bilobjekt, och kugghjulet för inställningar. 
                  Klicka på valfri bil för att öppna detaljsidan där du hanterar bilder.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Hantera bilar */}
          <AccordionItem value="manage-cars" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              🚗 Hantera bilar
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Lägga till bil</h4>
                <p>
                  Klicka på "Lägg till bil" i toppmenyn. Fyll i bilens registreringsnummer så hämtas information automatiskt. 
                  Du kan också fylla i märke, modell och årsmodell manuellt.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Redigera bilnamn</h4>
                <p>
                  På bilens detaljsida kan du klicka på pennikonen bredvid bilnamnet för att ändra det. 
                  Detta påverkar bara visningsnamnet i appen.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Ta bort bil</h4>
                <p>
                  På detaljsidan finns en "Ta bort bil"-knapp längst ner. 
                  Bekräfta borttagningen i dialogrutan som visas. Observera att alla bilder kopplade till bilen också tas bort.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Ladda upp bilder */}
          <AccordionItem value="upload-photos" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              📷 Ladda upp bilder
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Huvudbilder vs Dokumentationsbilder</h4>
                <p>
                  <strong>Huvudbilder:</strong> Dessa är dina professionella säljbilder som kan AI-redigeras. 
                  De visas i galleriet och kan delas via landningssidor.
                </p>
                <p className="mt-2">
                  <strong>Dokumentationsbilder:</strong> Dessa är för internt bruk (skador, servicehistorik, etc.) 
                  och kan INTE AI-redigeras. De finns under "Dokumentation"-fliken.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Multi-upload</h4>
                <p>
                  Du kan välja flera bilder samtidigt från ditt galleri. 
                  Klicka på uppladdningsikonen och välj alla bilder du vill ladda upp på en gång.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Filformat som stöds</h4>
                <p>
                  JPEG, PNG, WebP och HEIC/HEIF. Maximal filstorlek är 10 MB per bild.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* AI-redigering */}
          <AccordionItem value="ai-editing" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              ✨ AI-redigering
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Hur det fungerar</h4>
                <p>
                  Välj en eller flera huvudbilder genom att klicka på dem, sedan klicka på "AI redigera". 
                  Vår AI tar bort den befintliga bakgrunden och ersätter den med en professionell studiobakgrund 
                  baserat på din valda mall.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Bearbetningstid</h4>
                <p>
                  Varje bild tar ca 20-30 sekunder att bearbeta. Du kan navigera bort från sidan under tiden – 
                  bearbetningen fortsätter i bakgrunden och statusen uppdateras automatiskt.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Viktigt att veta</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Endast huvudbilder kan AI-redigeras (inte dokumentationsbilder)</li>
                  <li>Redigerade bilder går att generera om ifall du inte tycker om de </li>
                  <li>Varje redigerad bild kostar 4,95 kr (gratis under testperioden)</li>
                  <li>Du måste ha en betalmetod registrerad efter testperioden</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Video på hur man gör</h4>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/8JOnqNLX5ww" 
                    title="Video på hur man gör"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Bakgrundsmallar */}
          <AccordionItem value="background-templates" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              🎨 Bakgrundsmallar
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Fördefinierade mallar</h4>
                <p>
                  Luvero erbjuder 9 professionella bakgrundsmallar som är optimerade för bilbilder:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li><strong>Showroom</strong> – Klassisk grå golv med vit vägg</li>
                  <li><strong>Luxury Studio</strong> – Mörkt glansigt golv med professionell belysning</li>
                  <li><strong>Soft Grey Gradient</strong> – Mjuk grå gradient</li>
                  <li><strong>White Infinity Cove</strong> – Vit oändlighetsbakgrund</li>
                  <li><strong>Two-Tone Horizon</strong> – Tvåtonad horisont</li>
                  <li><strong>Light Showroom</strong> – Ljus showroom-miljö</li>
                  <li><strong>Dark Wall Light Floor</strong> – Mörk vägg med ljust golv</li>
                  <li><strong>Very Light Studio</strong> – Mycket ljus studiomiljö</li>
                  <li><strong>Darker Lower Wall</strong> – Mörkare nedre väggparti</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Egen bakgrund</h4>
                <p>
                  Du kan också skapa en egen bakgrund genom att skriva en beskrivning. 
                  <strong className="text-yellow-500"> OBS!</strong> Egna bakgrunder kan bli oförutsägbara 
                  eftersom du styr dem helt själv. Använd fördefinierade mallar för bäst resultat.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Byta mall</h4>
                <p>
                  Gå till Inställningar → Bakgrund för att välja din bakgrundsmall. 
                  Vald mall används för alla framtida AI-redigeringar i ditt företag.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Video på hur man gör</h4>
                <div className="aspect-video rounded-lg overflow-hidden">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src="https://www.youtube.com/embed/8JOnqNLX5ww" 
                    title="Video på hur man gör"
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  />
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Vattenmärken */}
          <AccordionItem value="watermarks" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              💧 Vattenmärken
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Konfigurera vattenmärke</h4>
                <p>
                  Gå till Inställningar → Vattenmärke. Ladda upp din logotyp som ska användas som vattenmärke.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Positionering</h4>
                <p>
                  Dra och släpp vattenmärket på förhandsvisningen för att placera det där du vill. 
                  Använd opacitetsreglaget för att justera genomskinligheten (0-100%).
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Applicera vattenmärke</h4>
                <p>
                  Välj redigerade bilder på detaljsidan och klicka på "Lägg till vattenmärke". 
                  Vattenmärket appliceras permanent på bilderna.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Viktigt</h4>
                <p>
                  Vattenmärken kan endast läggas till på redan AI-redigerade bilder. 
                  När ett vattenmärke är applicerat kan det inte tas bort.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Dela bilder */}
          <AccordionItem value="share-photos" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              🔗 Dela bilder
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Skapa delningslänk</h4>
                <p>
                  Välj de bilder du vill dela (både huvudbilder och dokumentationsbilder) och klicka på "Dela". 
                  En unik länk genereras som du kan skicka till kunder eller kollegor.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Landningssidor</h4>
                <p>
                  Delningslänken öppnar en snygg landningssida med dina valda bilder. 
                  Utseendet på landningssidan konfigureras i Inställningar → Landningssida.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Utgångstid</h4>
                <p>
                  Delade landningssidor upphör automatiskt efter 30 dagar och blir då otillgängliga.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Team-funktioner */}
          <AccordionItem value="team-features" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              👥 Team-funktioner
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Admin vs Anställda</h4>
                <p>
                  <strong>Admin:</strong> Har full tillgång till alla funktioner inklusive team-hantering, 
                  betalningsinställningar och fakturering.
                </p>
                <p className="mt-2">
                  <strong>Anställda:</strong> Kan lägga till bilar, ladda upp bilder, AI-redigera och dela – 
                  men kan INTE se Team- eller Betalningsinställningar.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Bjuda in teammedlemmar</h4>
                <p>
                  Som admin, gå till Inställningar → Team. Där hittar du en inbjudningskod som du kan dela med dina anställda. 
                  De registrerar sig med e-post och anger koden vid registrering.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Delad data</h4>
                <p>
                  Alla i teamet ser samma bilar, bilder och inställningar. 
                  Ändringar som görs av en teammedlem syns direkt för alla andra.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Kostnad</h4>
                <p>
                  Varje anställd kostar 299 kr/månad utöver basabonnemanget.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Betalning & Fakturering */}
          <AccordionItem value="billing" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              💳 Betalning & Fakturering
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Testperiod</h4>
                <p>
                  Alla nya konton får 21 dagars gratis testperiod med upp till 50 AI-redigerade bilder. 
                  Inget kreditkort krävs för att starta testperioden.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Lägga till betalmetod</h4>
                <p>
                  Gå till Inställningar → Betalning och klicka på "Lägg till betalmetod". 
                  Du dirigeras till vår säkra betalningsportal där du kan lägga till kort eller annan betalmetod.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Prissättning</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Start:</strong> 239 kr/månad + 4,95 kr per AI-redigerad bild</li>
                  <li><strong>Pro:</strong> 449 kr/månad + 1,95 kr per AI-redigerad bild</li>
                  <li><strong>Elit:</strong> 995 kr/månad + 0,99 kr per AI-redigerad bild</li>
                  <li><strong>Extra teammedlem:</strong> Helt Gratis </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Fakturor</h4>
                <p>
                  Fakturor genereras automatiskt varje månad och kan ses i Inställningar → Betalning. 
                  Du kan även ladda ner tidigare fakturor som PDF.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Felsökning */}
          <AccordionItem value="troubleshooting" className="border border-border/50 rounded-lg px-4 bg-card/50">
            <AccordionTrigger className="text-lg font-semibold">
              🔧 Felsökning
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground space-y-4">
              <div>
                <h4 className="font-medium text-foreground mb-2">Bilder laddas inte upp</h4>
                <p>
                  Kontrollera att bilden är i rätt format (JPEG, PNG, WebP, HEIC) och inte överstiger 10 MB. 
                  Prova att ladda om sidan och försök igen.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">AI-redigering fungerar inte</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li>Kontrollera att din testperiod inte har gått ut</li>
                  <li>Om testperioden är slut, se till att du har en betalmetod registrerad</li>
                  <li>Endast huvudbilder kan AI-redigeras (inte dokumentationsbilder)</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">"Bild Behandlas" visas länge</h4>
                <p>
                  AI-redigering tar normalt 20-30 sekunder. Om det tar längre tid, prova att ladda om sidan. 
                  Bearbetningen fortsätter i bakgrunden även om du navigerar bort.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Kan inte logga in</h4>
                <p>
                  Klicka på "Glömt lösenord?" på inloggningssidan för att återställa ditt lösenord. 
                  Ett mejl skickas till din registrerade e-postadress.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-foreground mb-2">Kontakta support</h4>
                <p>
                  Om du fortfarande har problem, kontakta oss på{" "}
                  <a className="text-primary hover:underline" href="mailto:support@luvero.se">
                    support@luvero.se
                  </a>{" "}
                  eller ring{" "}
                  <a className="text-primary hover:underline" href="tel:0793436810">
                    079-343 68 10  
                  </a>
                  .
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="mt-12 p-6 bg-card/50 border border-border/50 rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-2">Behöver du mer hjälp?</h3>
          <p className="text-muted-foreground">
            Kontakta oss gärna på{" "}
            <a className="text-primary hover:underline" href="mailto:support@luvero.se">
              support@luvero.se
            </a>{" "}
            eller ring{" "}
            <a className="text-primary hover:underline" href="tel:0793436810">
              079-343 68 10  
            </a>
            . Vi hjälper dig gärna!
          </p>
        </div>
      </div>
    </div>;
};
export default Documentation;