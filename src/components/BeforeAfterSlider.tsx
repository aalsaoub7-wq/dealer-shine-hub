import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import beforeImage from '@/assets/before-car.jpeg';
import afterImage from '@/assets/after-car.jpeg';

export const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false); // Start false until images loaded
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [loadedCount, setLoadedCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const animationRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

  // Track image loading
  useEffect(() => {
    if (loadedCount >= 2) {
      setImagesLoaded(true);
      setIsAnimating(true); // Start animation once images are loaded
    }
  }, [loadedCount]);

  const handleImageLoad = () => {
    setLoadedCount(prev => prev + 1);
  };

  // Cache container bounds
  useEffect(() => {
    const updateBounds = () => {
      if (containerRef.current) {
        boundsRef.current = containerRef.current.getBoundingClientRect();
      }
    };
    
    updateBounds();
    window.addEventListener('resize', updateBounds);
    window.addEventListener('scroll', updateBounds);
    
    return () => {
      window.removeEventListener('resize', updateBounds);
      window.removeEventListener('scroll', updateBounds);
    };
  }, []);

  // Automatic smooth animation with RAF
  useEffect(() => {
    if (!isAnimating) return;

    let direction = 1;
    let position = sliderPosition;

    const animate = () => {
      position += direction * 0.15;
      if (position >= 100 || position <= 0) {
        direction *= -1;
      }
      setSliderPosition(Math.max(0, Math.min(100, position)));
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isAnimating]);

  // Restart animation after inactivity
  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      // Only restart animation if not currently dragging
      if (!isDragging) {
        setIsAnimating(true);
      }
    }, 3000);
  };

  // Optimized move handler with RAF throttling
  const handleMove = (clientX: number) => {
    if (!isDragging || !boundsRef.current) return;

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    rafRef.current = requestAnimationFrame(() => {
      if (!boundsRef.current) return;
      
      const x = clientX - boundsRef.current.left;
      const percentage = Math.max(0, Math.min(100, (x / boundsRef.current.width) * 100));
      setSliderPosition(percentage);
    });
  };

  const handleMouseDown = () => {
    setIsDragging(true);
    setIsAnimating(false);
    // Update bounds right before dragging starts
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    resetInactivityTimer();
  };

  const handleTouchStart = () => {
    setIsDragging(true);
    setIsAnimating(false);
    // Update bounds right before dragging starts
    if (containerRef.current) {
      boundsRef.current = containerRef.current.getBoundingClientRect();
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    resetInactivityTimer();
  };

  // Global mouse events for smooth dragging
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        handleMouseUp();
      }
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX);
      }
    };

    if (isDragging) {
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('mousemove', handleGlobalMouseMove, { passive: true });
    }

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging]);

  // Cleanup RAF on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-border/50 select-none"
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Loading Overlay */}
      {!imagesLoaded && (
        <div className="absolute inset-0 z-20 bg-muted flex items-center justify-center rounded-3xl">
          <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
        </div>
      )}

      {/* Before Image */}
      <div 
        className={`absolute inset-0 transition-opacity duration-300 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`} 
        style={{ transform: 'translateZ(0)' }}
      >
        <img
          src={beforeImage}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={handleImageLoad}
        />
        {/* Before Label */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
          FÖRE
        </div>
      </div>

      {/* After Image (Clipped) */}
      <div
        className={`absolute inset-0 transition-opacity duration-300 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          willChange: 'clip-path',
          transform: 'translateZ(0)',
        }}
      >
        <img
          src={afterImage}
          alt=""
          className="w-full h-full object-cover"
          draggable={false}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onLoad={handleImageLoad}
        />
        {/* After Label */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
          EFTER
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className={`absolute top-0 bottom-0 w-1 cursor-ew-resize transition-opacity duration-300 ${imagesLoaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ 
          left: `${sliderPosition}%`,
          willChange: 'transform',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Vertical Line */}
        <div className="absolute inset-0 bg-white shadow-lg" />

        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white shadow-2xl flex items-center justify-center hover:scale-110 transition-transform duration-200">
          <ArrowLeftRight className="w-5 h-5 text-black" />
        </div>
      </div>
    </div>
  );
};