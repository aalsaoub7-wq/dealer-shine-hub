import { useState, useEffect, useRef, useCallback } from "react";
interface StatsParallaxSectionProps {
  className?: string;
}

export const StatsParallaxSection = ({ className }: StatsParallaxSectionProps) => {
  const [mousePosition, setMousePosition] = useState({
    x: 0,
    y: 0
  });
  const [isInView, setIsInView] = useState(false);
  const [count, setCount] = useState(0);
  const [countPrice, setCountPrice] = useState(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const targetPosition = useRef({
    x: 0,
    y: 0
  });
  const animationRef = useRef<number>();
  const hasMouseMoved = useRef(false);
  const hasAnimated = useRef(false);
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setIsInView(entry.isIntersecting), {
      threshold: 0.3
    });
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Count-up animation with easeOut (fast start, slow end)
  useEffect(() => {
    if (!isInView || hasAnimated.current) return;
    hasAnimated.current = true;
    const duration = 2000; // 2 seconds
    const startTime = performance.now();
    const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);
      setCount(Math.floor(easedProgress * 32));
      setCountPrice(Math.floor(easedProgress * 11));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(32);
        setCountPrice(11);
      }
    };
    requestAnimationFrame(animate);
  }, [isInView]);
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion || !sectionRef.current) return;
    hasMouseMoved.current = true;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    targetPosition.current = {
      x: x * 8,
      y: y * -8
    };
  }, [prefersReducedMotion]);
  useEffect(() => {
    if (prefersReducedMotion) return;
    const animate = () => {
      setMousePosition(prev => {
        if (!hasMouseMoved.current) return prev;
        return {
          x: prev.x + (targetPosition.current.x - prev.x) * 0.04,
          y: prev.y + (targetPosition.current.y - prev.y) * 0.04
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
  const parallaxStyle = (depth: number) => ({
    transform: prefersReducedMotion ? "none" : `perspective(1200px) rotateX(${mousePosition.y * 0.1}deg) rotateY(${mousePosition.x * 0.5}deg) translateZ(${depth}px)`,
    transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  });
  return <section ref={sectionRef} className={`relative py-28 md:py-40 overflow-hidden ${className || ''}`} style={{
    perspective: "1200px"
  }}>
      {/* Subtle green aurora glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none" style={{
      background: "radial-gradient(circle, hsl(142 76% 40%) 0%, transparent 70%)",
      filter: "blur(100px)"
    }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`relative transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`} style={parallaxStyle(0)}>
          <div className="relative flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 min-h-[400px]" style={{
          transformStyle: "preserve-3d"
        }}>
            {/* Main Card - 32% faster sales */}
            <div className={`relative z-10 transition-all duration-1000 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{
            ...parallaxStyle(40),
            transitionDelay: "200ms"
          }}>
              {/* Card outer glow */}
              <div className="absolute -inset-1 rounded-[2.5rem] opacity-60" style={{
              background: "linear-gradient(135deg, hsl(142 76% 40% / 0.3), hsl(84 81% 50% / 0.1), hsl(142 76% 40% / 0.3))",
              filter: "blur(20px)"
            }} />
              
              {/* Card */}
              <div className="relative p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Inner highlight */}
                <div className="absolute inset-0 rounded-[2rem]" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)"
              }} />

                {/* Content */}
                <div className="relative text-center space-y-4">
                  {/* Premium badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "400ms"
                }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Verifierad statistik</span>
                  </div>

                  {/* Hero number with count-up */}
                  <div>
                    <span className="text-7xl md:text-8xl font-black tracking-tighter" style={{
                    background: "linear-gradient(135deg, hsl(142 76% 55%) 0%, hsl(84 81% 60%) 50%, hsl(142 76% 45%) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 60px rgba(34, 197, 94, 0.4))"
                  }}>
                      {count}%
                    </span>
                  </div>
                  
                  <h3 className={`text-xl md:text-2xl font-bold text-foreground transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "300ms"
                }}>
                    snabbare försäljning
                  </h3>
                  
                  <p className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "400ms"
                }}>
                    Blocket-annonser med professionellt redigerade bilder säljer i genomsnitt 32% snabbare.
                  </p>

                  {/* Stats pills */}
                  
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
                background: "linear-gradient(90deg, transparent, hsl(142 76% 50% / 0.6), hsl(84 81% 55% / 0.4), transparent)"
              }} />
              </div>
            </div>

            {/* Second Card - 11% higher prices */}
            <div className={`relative z-10 transition-all duration-1000 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`} style={{
            ...parallaxStyle(40),
            transitionDelay: "400ms"
          }}>
              {/* Card outer glow */}
              <div className="absolute -inset-1 rounded-[2.5rem] opacity-60" style={{
              background: "linear-gradient(135deg, hsl(142 76% 40% / 0.3), hsl(84 81% 50% / 0.1), hsl(142 76% 40% / 0.3))",
              filter: "blur(20px)"
            }} />
              
              {/* Card */}
              <div className="relative p-8 md:p-12 rounded-[2rem] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Inner highlight */}
                <div className="absolute inset-0 rounded-[2rem]" style={{
                background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)"
              }} />

                {/* Content */}
                <div className="relative text-center space-y-4">
                  {/* Premium badge */}
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "600ms"
                }}>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Ökad lönsamhet</span>
                  </div>

                  {/* Hero number */}
                  <div>
                    <span className="text-7xl md:text-8xl font-black tracking-tighter" style={{
                    background: "linear-gradient(135deg, hsl(142 76% 55%) 0%, hsl(84 81% 60%) 50%, hsl(142 76% 45%) 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: "drop-shadow(0 0 60px rgba(34, 197, 94, 0.4))"
                  }}>
                      +{countPrice}%
                    </span>
                  </div>
                  
                  <h3 className={`text-xl md:text-2xl font-bold text-foreground transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "500ms"
                }}>
                    högre slutpris
                  </h3>
                  
                  <p className={`text-sm md:text-base text-muted-foreground leading-relaxed max-w-sm mx-auto transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
                  transitionDelay: "600ms"
                }}>
                    Bilar med professionella bilder uppnår i genomsnitt 11% högre försäljningspris.
                  </p>

                  {/* Stats pills */}
                  
                </div>

                {/* Bottom accent line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{
                background: "linear-gradient(90deg, transparent, hsl(142 76% 50% / 0.6), hsl(84 81% 55% / 0.4), transparent)"
              }} />
              </div>
            </div>

            {/* Floating accent elements */}
            <div className={`absolute -left-4 md:left-8 top-1/3 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
            ...parallaxStyle(100),
            transitionDelay: "600ms"
          }}>
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 backdrop-blur-sm rotate-12" />
            </div>

            <div className={`absolute -right-4 md:right-16 bottom-1/4 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`} style={{
            ...parallaxStyle(70),
            transitionDelay: "700ms"
          }}>
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-lime-500/15 to-transparent border border-lime-500/15 backdrop-blur-sm" />
            </div>
          </div>
        </div>
      </div>
    </section>;
};