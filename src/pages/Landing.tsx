import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import luveroLogo from "@/assets/luvero-logo-new.png";
import luveroLogoText from "@/assets/luvero-logo-text.png";
import adstuffLogo from "@/assets/adstuff-logo.png";
import { Brain, Shield, Globe, Users, ChevronDown, Menu, X, Package, Check, Phone, Mail, Download } from "lucide-react";
import { useState, useEffect, lazy, Suspense } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAInstallButton } from "@/components/PWAInstallButton";

// Lazy load heavy below-the-fold components
import { TypewriterText } from "@/components/TypewriterText";
import LogoMarquee from "@/components/LogoMarquee";
import { analytics } from "@/lib/analytics";
const ExclusiveProgram = lazy(() => import("@/components/ExclusiveProgram").then(m => ({
  default: m.ExclusiveProgram
})));
const StatsParallaxSection = lazy(() => import("@/components/StatsParallaxSection").then(m => ({
  default: m.StatsParallaxSection
})));

// JSON-LD structured data for SEO
const jsonLdData = {
  "@context": "https://schema.org",
  "@graph": [{
    "@type": "Organization",
    "@id": "https://luvero.se/#organization",
    "name": "Luvero",
    "url": "https://luvero.se",
    "logo": {
      "@type": "ImageObject",
      "url": "https://luvero.se/favicon.png"
    },
    "description": "Luvero redigerar bilfoton med AI. Ta bort bakgrund och lägg till studiobakgrund automatiskt. Perfekt för bilhandlare."
  }, {
    "@type": "SoftwareApplication",
    "@id": "https://luvero.se/#software",
    "name": "Luvero",
    "applicationCategory": "BusinessApplication",
    "operatingSystem": "Web, iOS, Android",
    "description": "AI-powered car photo editing platform for professional car dealers. Transform car photos with studio backgrounds in seconds.",
    "offers": {
      "@type": "Offer",
      "priceCurrency": "SEK",
      "description": "Professionell AI-bilredigering för återförsäljare"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "150"
    },
    "publisher": {
      "@id": "https://luvero.se/#organization"
    }
  }, {
    "@type": "WebSite",
    "@id": "https://luvero.se/#website",
    "url": "https://luvero.se",
    "name": "Luvero",
    "publisher": {
      "@id": "https://luvero.se/#organization"
    },
    "inLanguage": "sv-SE"
  }]
};
const Landing = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Inject JSON-LD structured data
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(jsonLdData);
    script.id = 'json-ld-structured-data';
    document.head.appendChild(script);
    return () => {
      const existingScript = document.getElementById('json-ld-structured-data');
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, []);
  useEffect(() => {
    analytics.landingPageVisited();
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in');
        }
      });
    }, {
      threshold: 0.1
    });
    document.querySelectorAll('.scroll-animate').forEach(el => {
      observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);
  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth'
    });
    setMobileMenuOpen(false);
  };
  return <div className="min-h-screen" style={{
    background: 'linear-gradient(to right, #050814 0%, #111322 50%, #1b0f16 100%)'
  }}>
      {/* Sticky Navigation Header */}
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.href = '/'}>
              <img src={luveroLogo} alt="Luvero AI bilredigering logotyp" className="h-8 w-8" width={32} height={32} />
              <img src={luveroLogoText} alt="Luvero" className="h-5" width={100} height={20} />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('exclusive-program')} className="text-sm font-medium animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 bg-[length:200%_auto] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Lorbit AI
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Funktioner
              </button>
              
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Så fungerar det
              </button>
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate("/auth")} className="bg-black text-white hover:bg-black hover:text-white hover:scale-100">
                  Logga in
                </Button>
              <Button onClick={() => scrollToSection('book-demo')} className="shadow-glow">
                Snacka med oss
              </Button>
              </div>
            </nav>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border/50">
            <div className="px-4 py-4 space-y-3">
              <button onClick={() => scrollToSection('features')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('book-demo')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Snacka med oss
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Så fungerar det
              </button>
              <button onClick={() => scrollToSection('exclusive-program')} className="block w-full text-left px-3 py-2 text-sm font-medium animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 bg-[length:200%_auto] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Lorbit AI
              </button>
              <Button className="w-full bg-black text-white hover:bg-black hover:text-white hover:scale-100" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
              <Button className="w-full" onClick={() => scrollToSection('book-demo')}>
                Snacka med oss
              </Button>
            </div>
          </div>}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-4">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-[120px]">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8 animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                <Brain className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">Nu med AI-driven bakgrundsredigering</span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold leading-tight min-h-[10rem] md:min-h-[12rem] lg:min-h-[14rem]">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Professionella
                </span>
                <br />
                <span className="text-foreground inline-block">
                  <TypewriterText text="bilfoton på sekunder" delay={80} />
                </span>
              </h1>

              <p className="text-xl md:text-2xl leading-relaxed text-gray-200">Fungerar även som självständig lagerhantering eller som komplement till ditt befintliga system!</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('book-demo')}>
                  Snacka med oss
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-muted transition-all duration-300" onClick={() => scrollToSection('how-it-works')}>
                  Se hur det fungerar
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>

              
            </div>

            {/* Right Column - Before/After Demo */}
            <div className="relative animate-fade-in overflow-visible pb-0 my-[20px] pt-[60px]">
              {/* Soft glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-red-500/40 via-orange-500/30 to-red-500/40 rounded-3xl blur-3xl opacity-80 pointer-events-none" />
              <BeforeAfterSlider />
            </div>
          </div>
        </div>
      </section>

      {/* Logo Marquee */}
      <LogoMarquee />

      {/* Stats Parallax Section */}
      <Suspense fallback={<div className="min-h-[400px]" />}>
        <StatsParallaxSection className="pt-[40px] pb-0" />
      </Suspense>

      {/* How It Works */}
      <div className="h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <section id="how-it-works" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Så här fungerar det
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Få nya bakgrunder på några sekunder       
            </p>
          </div>

          {/* YouTube Video Embed with Glow */}
          <div className="relative max-w-4xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/50 via-orange-400/40 to-orange-500/50 rounded-3xl blur-2xl opacity-70" />
            <div className="absolute -inset-2 bg-gradient-to-br from-orange-500/30 to-orange-400/25 rounded-2xl blur-xl" />
            
            {/* Video container */}
            <div className="relative rounded-2xl overflow-hidden border border-orange-500/30 shadow-2xl shadow-orange-500/30" style={{
            padding: '56.25% 0 0 0',
            position: 'relative'
          }}>
              <iframe src="https://player.vimeo.com/video/1154144228?badge=0&autopause=0&player_id=0&app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share" referrerPolicy="strict-origin-when-cross-origin" loading="lazy" style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%'
            }} title="Luvero Demo" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Allt du behöver för professionella bilfoton
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Kraftfulla funktioner som hjälper dig sälja bilar snabbare
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Feature 1 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Brain className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">AI Bakgrundsredigering</h3>
              <p className="text-muted-foreground">
                Automatisk studiobakgrund på alla bilder med ett knapptryck. Du kan alltid göra om ifall du inte tycker om bakgrunden.             
              </p>
            </div>

            {/* Feature - FREE Lagerhantering */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Lagerhantering & Dokumentation</h3>
              <p className="text-muted-foreground">
                Använd som din huvudsakliga lagerhantering eller som komplement till ditt befintliga system.   
              </p>
            </div>

            {/* Feature 2 */}
            

            {/* Feature 3 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Vattenmärken</h3>
              <p className="text-muted-foreground">
                Lägg till din logga med ett knapptryck på alla dina bilder för att särskilja dig på blocket.              
              </p>
            </div>

            {/* Feature 4 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4">
                <Globe className="h-8 w-8 text-accent" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Delningsbara Landningssidor</h3>
              <p className="text-muted-foreground">
                Skapa unika länkar för varje bil att dela med kunder med bilder på bilar och dokument.      
              </p>
            </div>

            {/* Feature 5 */}
            <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Team Collaboration</h3>
              <p className="text-muted-foreground">
                Bjud in oändligt många anställda/partners och arbeta tillsammans i realtid. 
              </p>
            </div>

            {/* Feature 6 */}
             <div className="group p-8 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary/10">
              <div className="mb-4">
                <Download className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">Installera online</h3>
              <p className="text-muted-foreground">
                Installera Luvero direkt från din webbläsare — ingen app store behövs.
              </p>
              <PWAInstallButton variant="button" />
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section - REMOVED FROM RENDERING */}
      {false && <section className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Varför välja Luvero?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Se hur vi jämför med dagens standard      
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="backdrop-blur-xl bg-background/30 rounded-3xl border border-border/50 overflow-hidden shadow-elegant">
              {/* Table Header */}
              <div className="hidden md:grid gap-6 p-8 border-b border-border/50" style={{
              gridTemplateColumns: '45% 27.5% 27.5%'
            }}>
                <div className="flex items-center justify-start">
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Funktion
                  </p>
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <img src={luveroLogo} alt="" className="h-16 w-auto object-contain" />
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <img alt="" className="h-16 w-auto object-contain" src="/lovable-uploads/d55ff891-abe9-49b9-8998-689e97634ff1.png" />
                </div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden grid grid-cols-3 gap-3 p-4 border-b border-border/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Funktion</div>
                <div className="flex flex-col items-center gap-1">
                  <img src={luveroLogo} alt="" className="h-8 object-contain" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <img alt="Adstuff" className="h-8 object-contain" src="/lovable-uploads/dbac4fbf-0459-4356-a5d7-8c0f1643129b.png" />
                </div>
              </div>

              {/* Table Rows */}
              <div className="divide-y divide-border/30">
                {/* Row 1: Lagerhantering */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Lagerhantering och dokumentation</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600">fr. 349kr/mån
(ingår)
 </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">600kr+/månad</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Lagerhantering</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">fr. 349kr/mån (ingår)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs">600kr+/månad</span>
                  </div>
                </div>

                {/* Row 2: Extra användare */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Kostnad för extra användare</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600 text-center">Oändligt många gratis</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">300kr+/användare/månad</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Extra användare</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">Oändligt många gratis</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs text-center">300kr+/användare</span>
                  </div>
                </div>

                {/* Row 3: Fotoredigering pris */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Fotoredigering (pris per bild)</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600">fr. 1,95kr </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">20-100kr</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Pris/bild</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">fr. 1,95kr</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs">20-100kr</span>
                  </div>
                </div>

                {/* Row 4: Tid för fotoredigering */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Tid för fotoredigering</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600">20-30 sekunder</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">24h+ </p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Tid</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">20-30 sekunder</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs">24h+</span>
                  </div>
                </div>

                {/* Row 5: Kontroll av bakgrunden */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Byte av bakgrund</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600 text-center">Omedelbar anpassning</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground text-center">Lång väntetid </p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Bakgrund</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">Omedelbar anpassning</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs text-center">Lång väntetid</span>
                  </div>
                </div>

                {/* Row 6: Samspel med annan lagerhantering */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Integration med lagersystem</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600 text-center">Kommer snart </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground text-center">Ej säkert </p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Integration</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">​Kommer snart </span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs text-center">Ej säkert</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA after comparison */}
            <div className="text-center mt-12">
              <Button size="lg" className="text-lg py-6 px-12 shadow-glow hover:shadow-glow-lg transition-all duration-300" onClick={() => scrollToSection('book-demo')}>
                Snacka med oss
              </Button>
            </div>
          </div>
        </div>
      </section>}

      {/* Pricing Section - REMOVED FROM RENDERING */}
      {false && <section id="pricing" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Välj din plan
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Betala endast för det du använder. Inget kort behövs för att testa.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 md:gap-6 max-w-6xl mx-auto">
            {/* Start Plan */}
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-green-500/50 shadow-xl transition-all duration-300 md:hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-green-500">Start</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-green-500">349 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 5,95 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Lagerhantering & dokumentation', 'Obegränsat antal bilar', 'Obegränsat antal användare', 'AI bakgrundsredigering'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" variant="outline" className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10 flex flex-col gap-0.5 h-auto py-3" onClick={() => navigate("/auth?mode=signup&plan=start")}>
                  <span>Prova gratis i 21 dagar</span>
                  <span className="text-xs font-normal opacity-80">Inget kreditkort krävs.</span>
                </Button>
              </div>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="shimmer-border relative p-6 md:p-8 shadow-2xl shadow-blue-500/20 md:scale-105 transition-all duration-300 md:hover:scale-110 overflow-visible">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                <span className="px-4 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full whitespace-nowrap">
                  Billigast för dem flesta
                </span>
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-blue-500">Pro</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-blue-500">449 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 2,95 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Allt i Start', 'Bäst för dem flesta', 'Lägre kostnad per bild', 'Prioriterad support'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex flex-col gap-0.5 h-auto py-3" onClick={() => navigate("/auth?mode=signup&plan=pro")}>
                  <span>Prova gratis i 21 dagar</span>
                  <span className="text-xs font-normal opacity-80">Inget kreditkort krävs.</span>
                </Button>
              </div>
            </div>

            {/* Elit Plan */}
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-purple-500/50 shadow-xl transition-all duration-300 md:hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-purple-500">Elit</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-purple-500">995 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 1,95 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Allt i Pro', 'Bäst för storvolymsanvändare', 'Lägsta kostnad per bild', 'Dedikerad support'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" variant="outline" className="w-full border-purple-500/50 text-purple-500 hover:bg-purple-500/10 flex flex-col gap-0.5 h-auto py-3" onClick={() => navigate("/auth?mode=signup&plan=elit")}>
                  <span>Prova gratis i 21 dagar</span>
                  <span className="text-xs font-normal opacity-80">Inget kreditkort krävs.</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Break-even info */}
          <div className="mt-12 text-center">
            
            <p className="text-white/90 text-sm mt-4 font-medium">
              ✓ Prova gratis i 21 dagar eller tills du når 50 bilderedigeringar
            </p>
          </div>
        </div>
      </section>}

      {/* Book Demo Section */}
      <section id="book-demo" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Snacka med oss för att få tillgång
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Låt oss visa hur Luvero kan hjälpa ditt företag
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl overflow-hidden border border-border/50 shadow-2xl bg-card/50 backdrop-blur-sm">
              <iframe src="https://calendar.notion.so/meet/alfred-zbpoy1pru/l68e4p14" className="w-full h-[800px] border-0" title="Boka demo" loading="lazy" style={{
              overflow: 'hidden'
            }} />
            </div>
          </div>
        </div>
      </section>

      {/* Exclusive VIP Program Section */}
      <Suspense fallback={<div className="min-h-[600px]" />}>
        <ExclusiveProgram />
      </Suspense>

      {/* FAQ Section - REMOVED FROM RENDERING */}
      {false && <section className="py-20 md:py-32 scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Vanliga frågor
              </span>
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
                Vår AI redigerar bilder på 20-30 sekunder. Du kan ladda upp flera bilder samtidigt och få alla klara inom några minuter.
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-2" className="bg-card border border-border rounded-lg px-6">
            <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Kan jag redigera obegränsat antal bilder?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Ja! Det finns ingen begränsning på antal bilder du kan redigera.
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
                Hur fungerar den kostnadsfria testperioden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Du får prova alla funktioner gratis i 21 dagar eller tills du når 50 redigerade bilder (det som inträffar först). Ingen bindningstid och inget kreditkort krävs. Efter testperioden betalar du för din valda plan: Start (349 kr/mån + 5,95 kr/bild), Pro (449 kr/mån + 2,95 kr/bild) eller Elit (995 kr/mån + 1,95 kr/bild).
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Kan flera personer i mitt team använda samma konto?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Absolut! Du kan bjuda in obegränsat antal teammedlemmar helt gratis. Alla delar samma bildbibliotek och inställningar.
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </div>
      </section>}

      {/* Final CTA Section */}
      <section className="py-20 md:py-32 scroll-animate">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative p-12 md:p-16 rounded-3xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/20 backdrop-blur-sm border border-primary/30 shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-3xl" />
            
            <div className="relative space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Redo att förbättra dina bilfoton?
                </span>
              </h2>
              <div className="flex justify-center">
                <Button size="lg" className="text-lg px-12 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('book-demo')}>
                  Snacka med oss
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Column 1 - Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <img src={luveroLogo} alt="" className="h-6 w-6" />
                <img src={luveroLogoText} alt="" className="h-4" />
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

            {/* Column 3 - Contact */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Kontakt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a className="hover:text-foreground transition-colors flex items-center gap-2" href="tel:0793436810">
                    <Phone className="w-4 h-4" />
                    079-343 68 10    
                  </a>
                </li>
                <li>
                  <a href="mailto:admin@luvero.se" className="hover:text-foreground transition-colors flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    support@luvero.se
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4 - Legal & Help */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Hjälp & Juridiskt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="/guide" className="hover:text-foreground transition-colors">Guide för appen</a></li>
                <li><a href="/integritetspolicy" className="hover:text-foreground transition-colors">Integritetspolicy</a></li>
                <li><a href="/användarvillkor" className="hover:text-foreground transition-colors">Användarvillkor</a></li>
                <li><PWAInstallButton variant="link" /></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2026 Luvero. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
      <PWAInstallPrompt />
    </div>;
};
export default Landing;