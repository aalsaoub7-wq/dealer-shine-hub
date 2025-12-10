import { useState, useEffect, useRef, useCallback } from "react";

export const StatsParallaxSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const hasMouseMoved = useRef(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion || !sectionRef.current) return;
    hasMouseMoved.current = true;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    targetPosition.current = { x: x * 8, y: y * -8 };
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
    transform: prefersReducedMotion 
      ? "none" 
      : `perspective(1200px) rotateX(${mousePosition.y * 0.5}deg) rotateY(${mousePosition.x * 0.5}deg) translateZ(${depth}px)`,
    transition: "transform 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)"
  });

  return (
    <section
      ref={sectionRef}
      className="relative py-28 md:py-40 overflow-hidden"
      style={{ perspective: "1200px" }}
    >
      {/* Subtle green aurora glow - no background, just accent */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-15 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(142 76% 40%) 0%, transparent 70%)",
          filter: "blur(100px)"
        }}
      />

      {/* Secondary accent glow */}
      <div 
        className="absolute top-1/4 right-1/4 w-[300px] h-[300px] rounded-full opacity-10 pointer-events-none"
        style={{
          background: "radial-gradient(circle, hsl(84 81% 50%) 0%, transparent 70%)",
          filter: "blur(80px)"
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className={`relative transition-all duration-1000 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
          style={parallaxStyle(0)}
        >
          <div 
            className="relative flex flex-col items-center justify-center min-h-[500px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Premium Main Card */}
            <div 
              className={`relative z-10 transition-all duration-1000 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
              style={{ ...parallaxStyle(40), transitionDelay: "200ms" }}
            >
              {/* Card outer glow */}
              <div 
                className="absolute -inset-1 rounded-[2.5rem] opacity-60"
                style={{
                  background: "linear-gradient(135deg, hsl(142 76% 40% / 0.3), hsl(84 81% 50% / 0.1), hsl(142 76% 40% / 0.3))",
                  filter: "blur(20px)"
                }}
              />
              
              {/* Card */}
              <div className="relative p-10 md:p-16 rounded-[2rem] bg-gradient-to-br from-white/[0.08] via-white/[0.04] to-white/[0.02] backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Inner highlight */}
                <div 
                  className="absolute inset-0 rounded-[2rem]"
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)"
                  }}
                />

                {/* Clean zigzag arrow graph */}
                <div 
                  className="absolute -top-8 -right-8 md:-top-4 md:-right-4 w-64 h-64 md:w-96 md:h-96"
                  style={parallaxStyle(80)}
                >
                  <svg 
                    viewBox="0 0 100 100" 
                    className="w-full h-full"
                    style={{ filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))" }}
                  >
                    <defs>
                      <linearGradient id="arrowGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(142 70% 35%)" />
                        <stop offset="100%" stopColor="hsl(142 70% 50%)" />
                      </linearGradient>
                    </defs>

                    {/* Clean zigzag arrow shape - filled polygon like reference */}
                    <g className={`transition-all duration-1000 ${isInView ? "opacity-100" : "opacity-0"}`}>
                      <polygon
                        points="
                          8,72
                          20,58
                          18,56
                          32,48
                          30,46
                          48,36
                          46,34
                          62,28
                          60,26
                          85,12
                          92,18
                          68,32
                          70,34
                          54,42
                          56,44
                          38,52
                          40,54
                          24,62
                          26,64
                          12,76
                        "
                        fill="url(#arrowGradient)"
                        className={isInView ? "animate-stats-draw-line" : ""}
                      />
                      
                      {/* Arrow head */}
                      <polygon
                        points="80,6 96,10 86,24"
                        fill="url(#arrowGradient)"
                        className={`transition-all duration-500 ${isInView ? "opacity-100" : "opacity-0"}`}
                        style={{ transitionDelay: "0.5s" }}
                      />
                    </g>
                  </svg>
                </div>

                {/* Content */}
                <div className="relative text-center md:text-left md:max-w-md space-y-6">
                  {/* Premium badge */}
                  <div 
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "400ms" }}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-400 tracking-wider uppercase">Verifierad statistik</span>
                  </div>

                  {/* Hero number */}
                  <div 
                    className={`transition-all duration-1000 ${isInView ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "500ms" }}
                  >
                    <span 
                      className="text-7xl md:text-9xl font-black tracking-tighter"
                      style={{
                        background: "linear-gradient(135deg, hsl(142 76% 55%) 0%, hsl(84 81% 60%) 50%, hsl(142 76% 45%) 100%)",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        filter: "drop-shadow(0 0 60px rgba(34, 197, 94, 0.4))"
                      }}
                    >
                      32%
                    </span>
                  </div>
                  
                  <h3 
                    className={`text-2xl md:text-3xl font-bold text-foreground transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "600ms" }}
                  >
                    snabbare försäljning
                  </h3>
                  
                  <p 
                    className={`text-base md:text-lg text-muted-foreground leading-relaxed max-w-sm transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "700ms" }}
                  >
                    Blocket-annonser med professionellt redigerade bilder säljer i genomsnitt 32% snabbare.
                  </p>

                  {/* Stats pills */}
                  <div 
                    className={`flex flex-wrap gap-3 pt-4 justify-center md:justify-start transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
                    style={{ transitionDelay: "800ms" }}
                  >
                    {[
                      { label: "+67% visningar", icon: "👁️" },
                      { label: "Fler leads", icon: "📈" },
                      { label: "Högre pris", icon: "💰" }
                    ].map((stat, i) => (
                      <div 
                        key={stat.label}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                        style={{ animationDelay: `${i * 100}ms` }}
                      >
                        <span className="text-sm">{stat.icon}</span>
                        <span className="text-sm font-medium text-foreground/80">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom accent line */}
                <div 
                  className="absolute bottom-0 left-0 right-0 h-[2px]"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(142 76% 50% / 0.6), hsl(84 81% 55% / 0.4), transparent)"
                  }}
                />
              </div>
            </div>

            {/* Floating accent elements */}
            <div 
              className={`absolute -left-4 md:left-8 top-1/3 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
              style={{ ...parallaxStyle(100), transitionDelay: "900ms" }}
            >
              <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-transparent border border-emerald-500/20 backdrop-blur-sm rotate-12" />
            </div>

            <div 
              className={`absolute -right-4 md:right-16 bottom-1/4 transition-all duration-700 ${isInView ? "opacity-100" : "opacity-0"}`}
              style={{ ...parallaxStyle(70), transitionDelay: "1000ms" }}
            >
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-lime-500/15 to-transparent border border-lime-500/15 backdrop-blur-sm" />
            </div>

            {/* Small floating particles */}
            {!prefersReducedMotion && isInView && (
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-emerald-400/40 animate-stats-particle"
                    style={{
                      left: `${20 + (i % 4) * 20}%`,
                      top: `${60 + (i % 2) * 20}%`,
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${4 + (i % 3)}s`
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
