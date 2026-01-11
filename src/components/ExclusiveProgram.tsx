import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Lock, Play, ChevronDown, Zap, Target, Bell, Filter, Check } from "lucide-react";
import blocketLogo from "@/assets/blocket-vip-logo.png";
import fbmLogo from "@/assets/fbm-vip-logo.png";
import luveroLogo from "@/assets/luvero-logo-new.png";
export const ExclusiveProgram = () => {
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection observer for fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.1
    });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Smooth mouse position with interpolation for natural feel
  const targetPosition = useRef({
    x: 0,
    y: 0
  });
  const animationRef = useRef<number>();
  const hasMouseMoved = useRef(false);

  // Mouse tracking for 3D parallax (desktop only)
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion || !sectionRef.current) return;
    hasMouseMoved.current = true;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    // Slightly increased sensitivity: max 3.5 degrees
    targetPosition.current = {
      x: x * 3.5,
      y: y * -3.5
    };
  }, [prefersReducedMotion]);

  // Smooth interpolation animation loop for natural movement
  useEffect(() => {
    if (prefersReducedMotion) return;
    const animate = () => {
      setMousePosition(prev => {
        // Only interpolate if mouse has moved, otherwise stay at 0,0 (neutral)
        if (!hasMouseMoved.current) return prev;
        return {
          x: prev.x + (targetPosition.current.x - prev.x) * 0.08,
          y: prev.y + (targetPosition.current.y - prev.y) * 0.08
        };
      });
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [prefersReducedMotion]);
  useEffect(() => {
    if (prefersReducedMotion) return;
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove, prefersReducedMotion]);
  const handleApplyClick = () => {
    console.log('analytics.track("vip_apply_clicked")');
    setApplyModalOpen(true);
  };
  const handleDemoClick = () => {
    console.log('analytics.track("vip_demo_opened")');
    setDemoModalOpen(true);
  };
  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Namn krävs";
    if (!formData.email.trim()) errors.email = "E-post krävs";else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = "Ogiltig e-postadress";
    if (!formData.phone.trim()) errors.phone = "Telefon krävs";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      console.log('analytics.track("vip_form_submitted")', formData);
      setFormSubmitted(true);
    }
  };

  // Parallax style with smooth transitions - Y-axis (rotateX) heavily restricted
  const getParallaxStyle = (depth: number) => {
    if (prefersReducedMotion) return {};
    const rotateX = mousePosition.y * (depth * 0.008); // Heavily restricted Y-axis tilt
    const rotateY = mousePosition.x * (depth * 0.04);
    return {
      transform: `translateZ(${depth * 0.5}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
    };
  };
  const hudChips = [{
    icon: Zap,
    label: "Deal Score",
    desc: "AI värdesätter alla bilar 0-100 m.h.a. en algoritm",
    color: "text-red-400"
  }, {
    icon: Target,
    label: "Marginalmål",
    desc: "beräknar din vinst på varje bil",
    color: "text-blue-400"
  }, {
    icon: Bell,
    label: "Direktnotiser",
    desc: "få en notis så fort en bra bil har lagts ut",
    color: "text-green-400"
  }, {
    icon: Filter,
    label: "Kvalitetsfilter",
    desc: "AI filtrerar bort alla bilar som du inte tjänar bra på",
    color: "text-purple-400"
  }];
  return <section ref={sectionRef} id="exclusive-program" className="relative min-h-[90vh] md:min-h-[90vh] w-full overflow-hidden py-20 md:py-32" style={{
    perspective: "1000px",
    transformStyle: "preserve-3d"
  }}>
      {/* No custom background - uses page background */}

      {/* Car doodle removed */}

      {/* HUD Glass Chips Layer - In front of main card */}
      <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 z-20 ${isInView ? "opacity-100" : "opacity-0"}`} style={getParallaxStyle(60)} aria-hidden="true">
        <div className="relative w-full max-w-5xl h-[500px] hidden md:block">
          {/* Deal Score chip - top left */}
          <div className="absolute top-4 left-4 animate-vip-float" style={{
          animationDelay: "0s"
        }}>
            <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border border-white/20 shadow-lg animate-vip-pulse-glow">
              <span className="text-xs font-mono text-green-400">Ny annons</span>
            </div>
          </div>
          
          {/* Deal score - top right */}
          <div className="absolute top-4 right-4 animate-vip-float" style={{
          animationDelay: "0.5s"
        }}>
            <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border border-blue-500/30 shadow-lg animate-vip-pulse-glow" style={{
            animationDelay: "2s"
          }}>
              <span className="text-xs font-mono text-blue-400">Deal score </span>
              <span className="text-sm font-bold text-white">92</span>
            </div>
          </div>
          
          {/* Margin chip - bottom left */}
          <div className="absolute bottom-4 left-4 animate-vip-float" style={{
          animationDelay: "1s"
        }}>
            <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border border-red-500/30 shadow-lg animate-vip-pulse-glow" style={{
            animationDelay: "4s"
          }}>
              <span className="text-xs font-mono text-red-400">Marginal </span>
              <span className="text-sm font-bold text-white">+24 000 kr</span>
            </div>
          </div>
          
          {/* Notification chip - bottom right */}
          <div className="absolute bottom-4 right-4 animate-vip-float" style={{
          animationDelay: "1.5s"
        }}>
            <div className="px-4 py-2 rounded-lg backdrop-blur-md bg-black/60 border border-green-500/30 shadow-lg animate-vip-pulse-glow" style={{
            animationDelay: "6s"
          }}>
              <span className="text-xs font-mono text-green-400">✓ Notifiering skickad</span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Logos Layer - No cards/frames, in front of main card */}
      <div className="absolute inset-0 flex items-center justify-between px-8 md:px-24 pointer-events-none z-30" style={getParallaxStyle(80)} aria-hidden="true">
        {/* Blocket logo - left, bigger, no frame */}
        <div className={`hidden md:block transition-all duration-1000 ${isInView ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-10"}`} style={{
        transitionDelay: "600ms",
        filter: "drop-shadow(0 0 35px rgba(249,115,22,0.5))"
      }}>
          <img src={blocketLogo} alt="" className="h-32 w-auto object-contain" />
        </div>
        
        {/* Facebook Marketplace logo - right, bigger, no frame */}
        <div className={`hidden md:block transition-all duration-1000 ${isInView ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"}`} style={{
        transitionDelay: "800ms",
        filter: "drop-shadow(0 0 35px rgba(59,130,246,0.5))"
      }}>
          <img src={fbmLogo} alt="" className="h-32 w-auto object-contain" />
        </div>
      </div>

      {/* Main Content Card - Foreground */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[70vh]" style={getParallaxStyle(50)}>
        {/* Badge with Luvero logo - Much larger */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-md bg-gradient-to-r from-red-500/25 to-orange-500/25 border border-red-500/40 mb-8 transition-all duration-700 shadow-[0_0_30px_rgba(255,59,59,0.3)] ${isInView ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4"}`}>
          <img src={luveroLogo} alt="" className="h-5 w-5 object-contain" />
          <span className="text-lg font-bold text-white animate-vip-shine leading-none">
            Lorbit AI
          </span>
        </div>

        {/* Main Glass Card */}
        <div className={`relative w-full max-w-2xl p-8 md:p-12 rounded-3xl backdrop-blur-xl bg-white/5 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.1)] transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`} style={{
        transitionDelay: "200ms"
      }}>
          {/* Gradient border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20 opacity-50 pointer-events-none" />
          
          <div className="relative z-10 text-center">
            {/* Mobile logos */}
            <div className="flex justify-center gap-4 mb-6 md:hidden">
              <div className="p-3 rounded-xl backdrop-blur-md bg-black/30 border border-orange-500/20">
                <img src={blocketLogo} alt="" className="h-6 w-auto" />
              </div>
              <div className="p-3 rounded-xl backdrop-blur-md bg-black/30 border border-blue-500/20">
                <img src={fbmLogo} alt="" className="h-6 w-auto" />
              </div>
            </div>

            {/* Heading */}
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
            transitionDelay: "300ms"
          }}>
              Lorbit AI:{" "}
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-red-400 bg-clip-text text-transparent">
                Hittar bilar åt dig
              </span>
            </h2>

            {/* Ingress */}
            <p className={`text-lg md:text-xl text-gray-300 mb-8 max-w-xl mx-auto transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
            transitionDelay: "400ms"
          }}>Vår AI skannar Blocket & Facebook Marketplace dygnet runt och pingar dig bara när marginalen på bilen är bra.</p>

            {/* Feature chips */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
            transitionDelay: "500ms"
          }}>
              {hudChips.map((chip, index) => <div key={chip.label} className="flex items-start gap-3 p-3 rounded-xl backdrop-blur-md bg-white/5 border border-white/10 text-left" style={{
              transitionDelay: `${600 + index * 100}ms`
            }}>
                  <chip.icon className={`h-5 w-5 mt-0.5 ${chip.color} flex-shrink-0`} />
                  <div>
                    <span className="font-semibold text-white text-sm">{chip.label}</span>
                    <span className="text-gray-400 text-sm"> – {chip.desc}</span>
                  </div>
                </div>)}
            </div>

            {/* CTAs */}
            <div className={`flex flex-col sm:flex-row gap-4 justify-center transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
            transitionDelay: "700ms"
          }}>
              <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({
              behavior: 'smooth'
            })} size="lg" className="relative overflow-hidden bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold px-8 py-6 rounded-xl shadow-[0_0_30px_rgba(255,59,59,0.3)] hover:shadow-[0_0_40px_rgba(255,59,59,0.5)] transition-all duration-300 group">
              <Lock className="h-5 w-5 mr-2" />
                Få chansen att prova *
                {/* Sheen effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </Button>
              
            </div>
          </div>
        </div>

        {/* Footnote */}
        <p className={`mt-8 text-sm text-gray-300 text-center max-w-md transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{
        transitionDelay: "900ms"
      }}>
          * Endast en ny befintlig Luvero kund får köpa denna exklusiva AI varje månad. Prenumerera till Luvero för chansen att testa den.
        </p>

        {/* Scroll hint */}
        <div className={`mt-12 animate-vip-blink transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
        transitionDelay: "1000ms"
      }} aria-hidden="true">
          <ChevronDown className="h-6 w-6 text-gray-500" />
        </div>
      </div>

      {/* Apply Modal */}
      <Dialog open={applyModalOpen} onOpenChange={setApplyModalOpen}>
        <DialogContent className="sm:max-w-md bg-[#0c1219]/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <img src={luveroLogo} alt="" className="h-6 w-6 object-contain" />
              Ansök om plats
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Fyll i dina uppgifter så kontaktar vi dig om du väljs ut.
            </DialogDescription>
          </DialogHeader>
          
          {!formSubmitted ? <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-300">Namn *</Label>
                <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
              ...prev,
              name: e.target.value
            }))} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-red-500/20" placeholder="Ditt namn" />
                {formErrors.name && <p className="text-xs text-red-400">{formErrors.name}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300">E-post *</Label>
                <Input id="email" type="email" value={formData.email} onChange={e => setFormData(prev => ({
              ...prev,
              email: e.target.value
            }))} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-red-500/20" placeholder="din@email.se" />
                {formErrors.email && <p className="text-xs text-red-400">{formErrors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-300">Telefon *</Label>
                <Input id="phone" value={formData.phone} onChange={e => setFormData(prev => ({
              ...prev,
              phone: e.target.value
            }))} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-red-500/20" placeholder="070-123 45 67" />
                {formErrors.phone && <p className="text-xs text-red-400">{formErrors.phone}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="message" className="text-gray-300">Meddelande (valfritt)</Label>
                <Textarea id="message" value={formData.message} onChange={e => setFormData(prev => ({
              ...prev,
              message: e.target.value
            }))} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-red-500/50 focus:ring-red-500/20 min-h-[80px]" placeholder="Berätta gärna lite om din verksamhet..." />
              </div>
              
              <Button type="submit" className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white font-semibold py-6">
                Skicka ansökan
              </Button>
            </form> : <div className="py-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Tack för din ansökan!</h3>
              <p className="text-gray-400">Vi återkommer inom kort om du väljs ut till programmet.</p>
            </div>}
        </DialogContent>
      </Dialog>

      {/* Demo Modal */}
      <Dialog open={demoModalOpen} onOpenChange={setDemoModalOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0c1219]/95 backdrop-blur-xl border-white/10">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white flex items-center gap-2">
              <Play className="h-6 w-6 text-blue-400" />
              2-minuters demo
            </DialogTitle>
          </DialogHeader>
          <div className="aspect-video rounded-lg bg-black/50 border border-white/10 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <Play className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Video kommer snart</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </section>;
};