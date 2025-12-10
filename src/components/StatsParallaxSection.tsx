import { useState, useEffect, useRef, useCallback } from "react";
import { TrendingUp, Eye, Clock, Zap } from "lucide-react";

export const StatsParallaxSection = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isInView, setIsInView] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const targetPosition = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();
  const hasMouseMoved = useRef(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Intersection observer for animations
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Mouse tracking for 3D parallax
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (prefersReducedMotion || !sectionRef.current) return;
    hasMouseMoved.current = true;
    const rect = sectionRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    targetPosition.current = { x: x * 4, y: y * -4 };
  }, [prefersReducedMotion]);

  // Smooth interpolation animation
  useEffect(() => {
    if (prefersReducedMotion) return;
    
    const animate = () => {
      setMousePosition(prev => {
        if (!hasMouseMoved.current) return prev;
        return {
          x: prev.x + (targetPosition.current.x - prev.x) * 0.06,
          y: prev.y + (targetPosition.current.y - prev.y) * 0.06
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
      : `perspective(1000px) rotateX(${mousePosition.y * 0.3}deg) rotateY(${mousePosition.x * 0.3}deg) translateZ(${depth}px)`,
    transition: "transform 0.3s ease-out"
  });

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 overflow-hidden"
      style={{ perspective: "1000px" }}
    >
      {/* Animated green gradient background */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: "radial-gradient(ellipse at center, hsl(142 76% 36% / 0.3) 0%, transparent 70%)"
        }}
      />
      
      {/* Floating particles */}
      {!prefersReducedMotion && isInView && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-emerald-400/60 animate-stats-particle"
              style={{
                left: `${15 + (i % 4) * 25}%`,
                bottom: "20%",
                animationDelay: `${i * 0.8}s`,
                animationDuration: `${3 + (i % 3)}s`
              }}
            />
          ))}
        </div>
      )}

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          className={`relative transition-all duration-700 ${isInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          style={parallaxStyle(0)}
        >
          {/* 3D Container */}
          <div 
            className="relative flex flex-col items-center justify-center"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Background glow layer */}
            <div 
              className="absolute inset-0 -z-10"
              style={{
                ...parallaxStyle(-40),
                background: "radial-gradient(ellipse at center, hsl(142 76% 36% / 0.15) 0%, transparent 60%)",
                filter: "blur(60px)",
                transform: prefersReducedMotion ? "none" : `translateZ(-40px) scale(1.5)`
              }}
            />

            {/* Floating HUD chips - left */}
            <div 
              className={`absolute left-4 md:left-20 top-1/4 transition-all duration-500 ${isInView ? "opacity-100" : "opacity-0"}`}
              style={{
                ...parallaxStyle(60),
                transitionDelay: "200ms"
              }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm animate-stats-float">
                <Eye className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">+67% visningar</span>
              </div>
            </div>

            {/* Floating HUD chips - right */}
            <div 
              className={`absolute right-4 md:right-20 top-1/3 transition-all duration-500 ${isInView ? "opacity-100" : "opacity-0"}`}
              style={{
                ...parallaxStyle(50),
                transitionDelay: "400ms"
              }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm animate-stats-float" style={{ animationDelay: "1s" }}>
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">Snabbare affärer</span>
              </div>
            </div>

            {/* Bottom left chip */}
            <div 
              className={`absolute left-8 md:left-32 bottom-1/4 transition-all duration-500 ${isInView ? "opacity-100" : "opacity-0"}`}
              style={{
                ...parallaxStyle(40),
                transitionDelay: "600ms"
              }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 backdrop-blur-sm animate-stats-float" style={{ animationDelay: "2s" }}>
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-medium text-emerald-300">AI-optimerat</span>
              </div>
            </div>

            {/* Main stats card */}
            <div 
              className={`relative z-10 transition-all duration-700 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
              style={parallaxStyle(30)}
            >
              <div className="relative p-8 md:p-12 rounded-3xl bg-background/5 backdrop-blur-xl border border-emerald-500/20 shadow-[0_0_80px_rgba(34,197,94,0.15)]">
                {/* Animated arrow/graph SVG */}
                <div className="absolute -top-8 -right-8 md:-top-12 md:-right-12 w-32 h-32 md:w-48 md:h-48">
                  <svg 
                    viewBox="0 0 100 100" 
                    className={`w-full h-full ${isInView ? "animate-stats-glow-green" : ""}`}
                    style={{ filter: "drop-shadow(0 0 20px rgba(34, 197, 94, 0.5))" }}
                  >
                    {/* Graph line */}
                    <path
                      d="M 10 80 Q 30 75 40 60 T 60 40 T 90 15"
                      fill="none"
                      stroke="url(#greenGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                      className={isInView ? "animate-stats-draw-line" : ""}
                      style={{
                        strokeDasharray: 200,
                        strokeDashoffset: isInView ? 0 : 200
                      }}
                    />
                    {/* Arrow head */}
                    <polygon
                      points="85,20 95,12 88,25"
                      fill="hsl(142 76% 46%)"
                      className={`transition-all duration-1000 delay-700 ${isInView ? "opacity-100" : "opacity-0"}`}
                    />
                    {/* Glow dots along path */}
                    {[
                      { cx: 25, cy: 72 },
                      { cx: 45, cy: 55 },
                      { cx: 65, cy: 35 },
                      { cx: 85, cy: 18 }
                    ].map((dot, i) => (
                      <circle
                        key={i}
                        cx={dot.cx}
                        cy={dot.cy}
                        r="4"
                        fill="hsl(142 76% 56%)"
                        className={`transition-all duration-500 ${isInView ? "opacity-100" : "opacity-0"}`}
                        style={{ 
                          transitionDelay: `${800 + i * 200}ms`,
                          filter: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.8))"
                        }}
                      />
                    ))}
                    <defs>
                      <linearGradient id="greenGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="hsl(142 76% 36%)" />
                        <stop offset="100%" stopColor="hsl(84 81% 50%)" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Trending icon */}
                <div className="flex justify-center mb-6">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-lime-500/10 border border-emerald-500/30">
                    <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-emerald-400" />
                  </div>
                </div>

                {/* Big stat number */}
                <div className="text-center space-y-4">
                  <div 
                    className={`text-6xl md:text-8xl font-black bg-gradient-to-r from-emerald-400 via-lime-400 to-emerald-400 bg-clip-text text-transparent transition-all duration-1000 ${isInView ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
                    style={{ 
                      textShadow: "0 0 60px rgba(34, 197, 94, 0.3)",
                      transitionDelay: "300ms"
                    }}
                  >
                    42%
                  </div>
                  
                  <p className="text-lg md:text-xl text-foreground/90 font-medium max-w-lg">
                    snabbare försäljning
                  </p>
                  
                  <p className="text-sm md:text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Blocket-annonser med professionellt redigerade bilder säljer i genomsnitt 42% snabbare än annonser med vanliga mobilfoton.
                  </p>
                </div>

                {/* Subtle bottom glow line */}
                <div 
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-px"
                  style={{
                    background: "linear-gradient(90deg, transparent, hsl(142 76% 46% / 0.5), transparent)"
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
