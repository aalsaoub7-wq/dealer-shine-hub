import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import luveroLogo from "@/assets/luvero-logo.png";
import { 
  Sparkles, 
  Link2, 
  Shield, 
  Globe, 
  Users, 
  DollarSign,
  Upload,
  Wand2,
  Download,
  Check,
  ChevronDown,
  Menu,
  X,
  Package
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";

const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      { threshold: 0.1 }
    );
    
    document.querySelectorAll('.scroll-animate').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sticky Navigation Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <img src={luveroLogo} alt="Luvero" className="h-10 w-10" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Luvero ©
              </span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Priser
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Så fungerar det
              </button>
              <Button variant="ghost" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
              <Button onClick={() => navigate("/auth")} className="shadow-glow">
                Prova gratis i 21 dagar
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Priser
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Så fungerar det
              </button>
              <Button variant="ghost" className="w-full" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
              <Button className="w-full" onClick={() => navigate("/auth")}>
                Prova gratis i 21 dagar
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-primary/5 to-accent/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Nu med AI-driven bakgrundsredigering</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Professionella
                </span>
                <br />
                <span className="text-foreground">bilfoton på sekunder</span>
              </h1>

              <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed">
                Gratis lagerhantering och dokumentation för bilhandlare. AI-redigera dina bilder för bara 4,95 kr/bild – betala endast för det du använder.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
                  onClick={() => navigate("/auth")}
                >
                  Prova gratis i 21 dagar
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 hover:bg-muted transition-all duration-300"
                  onClick={() => scrollToSection('how-it-works')}
                >
                  Se hur det fungerar
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground">
                <Check className="h-5 w-5 text-primary" />
                <span className="font-medium">Betrodd av 150+ bilhandlare i Sverige</span>
              </div>
            </div>

            {/* Right Column - Before/After Demo */}
            <div className="relative hidden lg:block animate-fade-in">
              <BeforeAfterSlider />
            </div>
          </div>
        </div>
      </section>


      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Så här fungerar det
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Från uppladdning till publicering på 3 enkla steg
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-16 left-[16.666%] right-[16.666%] h-0.5 bg-gradient-to-r from-primary via-accent to-primary opacity-30" />

            {/* Step 1 */}
            <div className="relative text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20">
                1
              </div>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">Ladda upp bilder</h3>
              <p className="text-muted-foreground">
                Dra och släpp bilder från din telefon eller dator
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-accent to-accent/50 text-accent-foreground text-2xl font-bold shadow-lg shadow-accent/20">
                2
              </div>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                  <Wand2 className="h-8 w-8 text-accent" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">AI redigerar automatiskt</h3>
              <p className="text-muted-foreground">
                Vårt AI tar bort bakgrunden och skapar perfekt studiomiljö
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative text-center space-y-4 p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/50 text-primary-foreground text-2xl font-bold shadow-lg shadow-primary/20">
                3
              </div>
              <div className="flex justify-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Download className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-foreground">Ladda ner & publicera</h3>
              <p className="text-muted-foreground">
                Dela direkt till Blocket, Facebook Marketplace eller din hemsida
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 bg-muted/30 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Allt du behöver för professionella bilfoton
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kraftfulla funktioner som hjälper dig sälja bilar snabbare
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI Bakgrundsredigering</h3>
              <p className="text-muted-foreground">
                Automatisk studiobakgrund på alla bilder med ett knapptryck. Betala endast 4,95 kr per redigerad bild.
              </p>
            </div>

            {/* Feature - FREE Lagerhantering */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 mb-4">
                <span className="text-xs font-bold text-primary">GRATIS</span>
              </div>
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-2">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Lagerhantering & Dokumentation</h3>
              <p className="text-muted-foreground">
                Helt gratis lager- och dokumenthantering. Fungerar standalone eller integreras med ditt befintliga system.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4">
                <Link2 className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Blocket & Marketplace Integration</h3>
              <p className="text-muted-foreground">
                Synka direkt med Blocket och Facebook Marketplace
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Vattenmärken</h3>
              <p className="text-muted-foreground">
                Lägg till ditt varumärke automatiskt på alla bilder
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4">
                <Globe className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Delningsbara Landningssidor</h3>
              <p className="text-muted-foreground">
                Skapa unika länkar för varje bil att dela med kunder
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Bjud in anställda och arbeta tillsammans i realtid
              </p>
            </div>

            {/* Feature 6 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4">
                <DollarSign className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Transparent Prissättning</h3>
              <p className="text-muted-foreground">
                Betala endast för det du använder - 4,95 kr per bild
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Enkel prissättning
            </h2>
            <p className="text-xl text-muted-foreground">
              Betala endast för det du använder. Inga dolda kostnader.
            </p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="relative p-8 md:p-12 rounded-3xl bg-gradient-to-br from-card to-muted border-2 border-primary/50 shadow-2xl shadow-primary/20">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-3xl" />
              
              <div className="relative text-center space-y-6">
                <div>
                  <div className="flex items-baseline justify-center gap-2 mb-2">
                    <span className="text-6xl font-extrabold bg-gradient-primary bg-clip-text text-transparent">
                      4,95 kr
                    </span>
                  </div>
                  <p className="text-muted-foreground text-lg">per AI-redigerad bild – lagerhantering & dokumentation gratis</p>
                </div>

                <div className="space-y-3 text-left py-6">
                  {[
                    'Gratis lagerhantering',
                    'Gratis dokumentation av bilar',
                    'Betala bara för AI-redigering (4,95 kr/bild)',
                    'Obegränsat antal bilar och användare',
                    'Integration med befintliga system'
                  ].map((feature, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Check className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-foreground font-medium">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  size="lg" 
                  className="w-full text-lg py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300"
                  onClick={() => navigate("/auth")}
                >
                  Börja idag
                </Button>

                <p className="text-sm text-muted-foreground italic">
                  Traditionell bildredigering: 50-100 kr/bild
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-32 bg-muted/30 scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Vanliga frågor
            </h2>
            <p className="text-xl text-muted-foreground">
              Allt du behöver veta om Luvero
            </p>
          </div>

          <Accordion type="single" collapsible className="space-y-4">
            <AccordionItem value="item-1" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Hur lång tid tar det att redigera en bild?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Vår AI redigerar bilder på 5-10 sekunder. Du kan ladda upp flera bilder samtidigt och få alla klara inom några minuter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Kan jag redigera obegränsat antal bilder?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja! Det finns ingen begränsning på antal bilder du kan redigera. Du betalar endast 4,95 kr per redigerad bild.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-3" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Vilka format stöds?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Vi stödjer JPEG, PNG, WebP och HEIC/HEIF format. Max filstorlek är 10MB per bild.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-4" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Kan jag avbryta när som helst?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja, det finns ingen bindningstid. Du betalar bara för de bilder du redigerar och kan sluta använda tjänsten när som helst.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-5" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Har ni integration med Blocket?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja! Vi har direkt integration med Blocket och Facebook Marketplace så du kan synka dina bilar automatiskt.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Kan flera personer i mitt team använda samma konto?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolut! Du kan bjuda in obegränsat antal teammedlemmar att arbeta tillsammans. Alla delar samma bildbibliotek och inställningar.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-7" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Vad är gratis och vad kostar pengar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Lagerhantering och dokumentation av bilar är helt gratis utan begränsningar. Du betalar endast när du använder AI-redigeringsfunktionen – 4,95 kr per bild. Har du redan ett lagersystem kan Luvero integreras med det, annars använder du vår inbyggda lagerhantering helt kostnadsfritt.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 backdrop-blur-sm border border-primary/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl" />
            
            <div className="relative space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground">
                Redo att förbättra dina bilfoton?
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Börja gratis idag. Inget kreditkort krävs.
              </p>
              <Button 
                size="lg" 
                className="text-lg px-12 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105"
                onClick={() => navigate("/auth")}
              >
                Prova gratis i 21 dagar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-muted/50 border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Column 1 - Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src={luveroLogo} alt="Luvero" className="h-8 w-8" />
                <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
                  Luvero ©
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Professionell bildredigering för återförsäljare. Snabbt, enkelt, och prisvärt.
              </p>
            </div>

            {/* Column 2 - Product */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Produkt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <button onClick={() => scrollToSection('features')} className="hover:text-foreground transition-colors">
                    Funktioner
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('pricing')} className="hover:text-foreground transition-colors">
                    Priser
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection('how-it-works')} className="hover:text-foreground transition-colors">
                    Så fungerar det
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3 - Company */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Företag</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Om oss</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Kontakt</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Support</a></li>
              </ul>
            </div>

            {/* Column 4 - Legal */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Juridiskt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Integritetspolicy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Användarvillkor</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2024 Luvero. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
