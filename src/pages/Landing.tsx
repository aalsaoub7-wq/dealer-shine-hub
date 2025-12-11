import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import luveroLogo from "@/assets/luvero-logo-new.png";
import luveroLogoText from "@/assets/luvero-logo-text.png";
import adstuffLogo from "@/assets/adstuff-logo.png";
import { Brain, Link2, Shield, Globe, Users, DollarSign, Upload, Wand2, Download, Check, ChevronDown, Menu, X, Package, Phone, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BeforeAfterSlider } from "@/components/BeforeAfterSlider";
import { TypewriterText } from "@/components/TypewriterText";
import { ExclusiveProgram } from "@/components/ExclusiveProgram";
import { StatsParallaxSection } from "@/components/StatsParallaxSection";
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
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => scrollToSection('hero')}>
              <img src={luveroLogo} alt="Luvero" className="h-8 w-8" />
              <img src={luveroLogoText} alt="Luvero" className="h-5" />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('exclusive-program')} className="text-sm font-medium animate-rainbow-text bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 via-purple-500 to-red-500 bg-[length:200%_auto] bg-clip-text text-transparent hover:opacity-80 transition-opacity">
                Lorbit AI
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Funktioner
              </button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Priser
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors">
                Så fungerar det
              </button>
              <div className="flex items-center gap-3">
                <Button onClick={() => navigate("/auth")} className="bg-black text-white hover:bg-black hover:text-white hover:scale-100">
                  Logga in
                </Button>
              <Button onClick={() => scrollToSection('pricing')} className="shadow-glow">
                Prova gratis i 21 dagar
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
              <button onClick={() => scrollToSection('pricing')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Priser
              </button>
              <button onClick={() => scrollToSection('how-it-works')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Så fungerar det
              </button>
              <button onClick={() => scrollToSection('exclusive-program')} className="block w-full text-left px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-muted rounded-md transition-colors">
                Lorbit AI
              </button>
              <Button className="w-full bg-black text-white hover:bg-black hover:text-white hover:scale-100" onClick={() => navigate("/auth")}>
                Logga in
              </Button>
              <Button className="w-full" onClick={() => navigate("/auth?mode=signup")}>
                Prova gratis i 21 dagar
              </Button>
            </div>
          </div>}
      </header>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden pt-4">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 pb-[180px]">
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
                <Button size="lg" className="text-lg px-8 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('pricing')}>
                  Prova gratis i 21 dagar
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 hover:bg-muted transition-all duration-300" onClick={() => scrollToSection('how-it-works')}>
                  Se hur det fungerar
                  <ChevronDown className="ml-2 h-5 w-5" />
                </Button>
              </div>

              
            </div>

            {/* Right Column - Before/After Demo */}
            <div className="relative animate-fade-in overflow-visible pb-8">
              {/* Soft glow effect */}
              <div className="absolute -inset-8 bg-gradient-to-r from-red-500/40 via-orange-500/30 to-red-500/40 rounded-3xl blur-3xl opacity-80 pointer-events-none" />
              <div className="relative">
                <BeforeAfterSlider />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer to allow glow to show */}
      <div className="h-8" />

      {/* Stats Parallax Section */}
      <StatsParallaxSection className="pb-[100px] pt-[40px]" />

      {/* How It Works */}
      <section id="how-it-works" className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Så här fungerar det
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Frå nya bakgrunder på några sekunder       
            </p>
          </div>

          {/* YouTube Video Embed with Glow */}
          <div className="relative max-w-4xl mx-auto">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/40 via-accent/30 to-primary/40 rounded-3xl blur-2xl opacity-60" />
            <div className="absolute -inset-2 bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl blur-xl" />
            
            {/* Video container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-primary/20 shadow-2xl shadow-primary/20">
              <iframe src="https://www.youtube.com/embed/8JOnqNLX5ww" title="Luvero Demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="w-full h-full" />
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
              <div className="flex gap-2 mb-4">
                <img src="/assets/app-store-badge.webp" alt="Download on App Store" className="h-10 w-auto" />
                <img src="/assets/google-play-badge.webp" alt="Get it on Google Play" className="h-10 w-auto" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">​Finns där appar finns </h3>
              <p className="text-muted-foreground">
                 Luvero finns på både Play Store och App Store!                     
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-20 md:py-32 scroll-animate">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Varför välja Luvero?
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Se hur vi jämför med Adstuff
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
                  <img src={luveroLogo} alt="Luvero" className="h-16 w-auto object-contain" />
                </div>
                <div className="flex flex-col items-center justify-center gap-2">
                  <img src={adstuffLogo} alt="Adstuff" className="h-16 w-auto object-contain" />
                </div>
              </div>

              {/* Mobile Header */}
              <div className="md:hidden grid grid-cols-3 gap-3 p-4 border-b border-border/50">
                <div className="text-xs font-semibold text-muted-foreground uppercase">Funktion</div>
                <div className="flex flex-col items-center gap-1">
                  <img src={luveroLogo} alt="Luvero" className="h-8 object-contain" />
                </div>
                <div className="flex flex-col items-center gap-1">
                  <img src={adstuffLogo} alt="Adstuff" className="h-8 object-contain" />
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
                    <p className="text-sm font-bold text-emerald-600">fr. 239kr/mån
(ingår)
 </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">599kr/månad</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Lagerhantering</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">fr. 239kr/mån (ingår)</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs">599kr/månad</span>
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
                    <p className="text-sm text-muted-foreground">299kr/användare/månad</p>
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
                    <span className="text-xs text-center">299kr
/användare/mån</span>
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
                    <p className="text-sm font-bold text-emerald-600">fr. 0.99kr </p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground">18,74kr</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Pris/bild</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600">fr. 0.99kr</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs">18,74kr</span>
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
                    <p className="text-sm text-muted-foreground">2-12+ timmar</p>
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
                    <span className="text-xs">2-12+ timmar</span>
                  </div>
                </div>

                {/* Row 5: Kontroll av bakgrunden */}
                <div className="hidden md:grid gap-6 p-6 hover:bg-accent/5 transition-colors items-center" style={{
                gridTemplateColumns: '45% 27.5% 27.5%'
              }}>
                  <div className="flex items-center">
                    <p className="text-base font-medium text-foreground">Kontroll av bakgrunden</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Check className="w-5 h-5 text-emerald-500" />
                    <p className="text-sm font-bold text-emerald-600 text-center">Omedelbar anpassning</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground text-center">2-12+ timmar väntetid</p>
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
                    <span className="text-xs text-center">2-12+ timmar väntetid</span>
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
                    <p className="text-sm font-bold text-emerald-600 text-center">Fixas vid behov</p>
                  </div>
                  <div className="flex flex-col items-center justify-center gap-2">
                    <X className="w-5 h-5 text-destructive" />
                    <p className="text-sm text-muted-foreground text-center">Ej möjlig</p>
                  </div>
                </div>
                <div className="md:hidden grid grid-cols-3 gap-3 p-4">
                  <div className="text-xs font-medium">Integration</div>
                  <div className="flex flex-col items-center gap-1">
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-bold text-emerald-600 text-center">Fixas vid behov</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <X className="w-4 h-4 text-destructive" />
                    <span className="text-xs text-center">Ej möjlig</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA after comparison */}
            <div className="text-center mt-12">
              <Button size="lg" className="text-lg py-6 px-12 shadow-glow hover:shadow-glow-lg transition-all duration-300" onClick={() => scrollToSection('pricing')}>
                Prova gratis i 21 dagar
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 md:py-32 scroll-animate">
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
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-green-500/50 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-semibold bg-green-500 text-white rounded-full">
                  Billigast &lt; 100 bilder
                </span>
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-green-500">Start</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-green-500">239 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 4,95 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Lagerhantering & dokumentation', 'Obegränsat antal bilar', 'Obegränsat antal användare', 'AI bakgrundsredigering'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm whitespace-nowrap">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" variant="outline" className="w-full border-green-500/50 text-green-500 hover:bg-green-500/10" onClick={() => navigate("/auth?mode=signup&plan=start")}>
                  Prova gratis i 21 dagar
                </Button>
              </div>
            </div>

            {/* Pro Plan - Most Popular */}
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-blue-500 shadow-2xl shadow-blue-500/20 scale-105 transition-all duration-300 hover:scale-110">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-4 py-1 text-xs font-semibold bg-blue-500 text-white rounded-full">
                  Mest populär
                </span>
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-blue-500">Pro</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-blue-500">449 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 1,95 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Allt i Start', 'Bäst för dem flesta', 'Lägre kostnad per bild', 'Prioriterad support'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" className="w-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30" onClick={() => navigate("/auth?mode=signup&plan=pro")}>
                  Prova gratis i 21 dagar
                </Button>
              </div>
            </div>

            {/* Elit Plan */}
            <div className="relative p-6 md:p-8 rounded-3xl bg-card border-2 border-purple-500/50 shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 text-xs font-semibold bg-purple-500 text-white rounded-full">
                  Bäst för 500+ bilder
                </span>
              </div>
              
              <div className="text-center space-y-4 mt-4">
                <h3 className="text-2xl font-bold text-purple-500">Elit</h3>
                <div className="flex flex-col items-center gap-1">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-purple-500">995 kr</span>
                    <span className="text-muted-foreground">/mån</span>
                  </div>
                  <p className="text-lg text-muted-foreground">+ 0,99 kr per bild</p>
                </div>

                <div className="py-4 space-y-3">
                  {['Allt i Pro', 'Bäst för storvolymsanvändare', 'Lägsta kostnad per bild', 'Dedikerad support'].map((feature, i) => <div key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </div>)}
                </div>

                <Button size="lg" variant="outline" className="w-full border-purple-500/50 text-purple-500 hover:bg-purple-500/10" onClick={() => navigate("/auth?mode=signup&plan=elit")}>
                  Prova gratis i 21 dagar
                </Button>
              </div>
            </div>
          </div>

          {/* Break-even info */}
          <div className="mt-12 text-center">
            
            <p className="text-muted-foreground text-sm mt-4 font-medium">
              ✓ Inget kort behövs för testperioden (21 dagar eller 50 bilder)
            </p>
          </div>
        </div>
      </section>

      {/* Exclusive VIP Program Section */}
      <ExclusiveProgram />

      {/* FAQ Section */}
      <section className="py-20 md:py-32 scroll-animate">
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
                Hur fungerar den kostnadsfria testperioden?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Du får prova alla funktioner gratis i 21 dagar eller tills du når 50 redigerade bilder (det som inträffar först). Ingen bindningstid och inget kreditkort krävs. Efter testperioden betalar du för din valda plan: Start (239 kr/mån + 4,95 kr/bild), Pro (449 kr/mån + 1,95 kr/bild) eller Elit (995 kr/mån + 0,99 kr/bild).
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

            <AccordionItem value="item-7" className="bg-card border border-border rounded-lg px-6">
              <AccordionTrigger className="text-left font-semibold hover:no-underline">
                Vad är gratis och vad kostar pengar?
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground">
                Appen kostar 239 kr/månad och inkluderar fullständig lagerhantering och dokumentation utan begränsningar. Du kan använda Luvero som din huvudsakliga lagerhantering eller som ett komplement till ditt befintliga system (t.ex. Smart365, Bytbil) vid behov. När du använder AI-redigeringsfunktionen tillkommer 4,95 kr per bild utöver månadsavgiften. Integrationer med befintliga system kan ordnas vid behov.
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
              <h2 className="text-4xl md:text-5xl font-bold">
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  Redo att förbättra dina bilfoton?
                </span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Börja gratis idag. Inget kreditkort krävs.
              </p>
              <div className="flex justify-center">
                <Button size="lg" className="text-lg px-12 py-6 shadow-glow hover:shadow-glow-lg transition-all duration-300 hover:scale-105" onClick={() => scrollToSection('pricing')}>
                  Prova gratis i 21 dagar
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
                <img src={luveroLogo} alt="Luvero" className="h-6 w-6" />
                <img src={luveroLogoText} alt="Luvero" className="h-4" />
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
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50 text-center text-sm text-muted-foreground">
            <p>© 2025 Luvero. Alla rättigheter förbehållna.</p>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;