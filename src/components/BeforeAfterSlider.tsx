import { useState, useEffect, useRef } from 'react';
import { ArrowLeftRight } from 'lucide-react';
import beforeImage from '@/assets/before-car.webp';
import afterImage from '@/assets/after-car.jpg';

export const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);
  const animationRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const inactivityTimerRef = useRef<NodeJS.Timeout>();

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
      setIsAnimating(true);
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
      {/* Before Image */}
      <div className="absolute inset-0">
        <img
          src={beforeImage}
          alt="Före AI-redigering"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* Before Label */}
        <div className="absolute top-4 left-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
          FÖRE
        </div>
      </div>

      {/* After Image (Clipped) */}
      <div
        className="absolute inset-0"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          willChange: 'clip-path',
        }}
      >
        <img
          src={afterImage}
          alt="Efter AI-redigering"
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* After Label */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-white text-sm font-medium">
          EFTER
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 cursor-ew-resize"
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
