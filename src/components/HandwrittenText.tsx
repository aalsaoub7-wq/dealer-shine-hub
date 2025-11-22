import { useEffect, useState } from "react";

export const HandwrittenText = () => {
  const text = "bilfoton på sekunder";
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Calculate total animation time: characters * delay + animation duration + underline
    const totalTime = text.length * 60 + 400 + 800;
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, totalTime);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative inline-block">
      <svg
        viewBox="0 0 800 120"
        className="w-full h-auto"
        style={{ maxWidth: "800px" }}
        aria-label="bilfoton på sekunder"
      >
        <defs>
          <style>
            {`
              @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&display=swap');
              .handwritten-text {
                font-family: 'Caveat', cursive;
                font-size: 80px;
                font-weight: 700;
              }
            `}
          </style>
        </defs>
        
        {/* Main text with individual letter fade-in animations */}
        <text
          x="10"
          y="70"
          className="handwritten-text"
          style={{
            color: "hsl(var(--foreground))"
          }}
        >
          {text.split('').map((char, index) => {
            // Add slight random variation to timing for organic feel
            const baseDelay = index * 0.06;
            const randomOffset = Math.random() * 0.02 - 0.01; // -0.01 to +0.01
            const delay = baseDelay + randomOffset;
            
            return (
              <tspan
                key={index}
                fill="currentColor"
                style={{
                  opacity: 0,
                  animation: `handwritten-letter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}s forwards`
                }}
              >
                {char}
              </tspan>
            );
          })}
        </text>

        {/* Hand-drawn underline under "sekunder" with fade-in */}
        <path
          d="M 480 85 Q 500 88 520 84 T 560 87 T 600 83 T 640 86 T 680 82 L 720 84"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          style={{
            opacity: 0,
            animation: `handwritten-letter 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) ${text.length * 0.06}s forwards`
          }}
        />
      </svg>
    </div>
  );
};
