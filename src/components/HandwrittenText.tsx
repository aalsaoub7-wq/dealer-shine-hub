import { useEffect, useState } from "react";

export const HandwrittenText = () => {
  const text = "bilfoton på sekunder";
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    // Calculate total animation time: characters * delay + animation duration + underline
    const totalTime = text.length * 100 + 200 + 1000;
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
              @keyframes stroke-draw-letter {
                0% { 
                  stroke-dashoffset: 50;
                  opacity: 0;
                }
                100% { 
                  stroke-dashoffset: 0;
                  opacity: 1;
                }
              }
            `}
          </style>
        </defs>
        
        {/* Main text with individual letter animations */}
        <text
          x="10"
          y="70"
          className="handwritten-text"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "hsl(var(--foreground))"
          }}
        >
          {text.split('').map((char, index) => (
            <tspan
              key={index}
              stroke="currentColor"
              strokeWidth="2.5"
              fill={animationComplete ? "currentColor" : "none"}
              strokeDasharray="50"
              strokeDashoffset="50"
              style={{
                animation: `stroke-draw-letter 0.2s ease-out ${index * 0.1}s forwards`
              }}
            >
              {char}
            </tspan>
          ))}
        </text>

        {/* Hand-drawn underline under "sekunder" */}
        <path
          d="M 480 85 Q 500 88 520 84 T 560 87 T 600 83 T 640 86 T 680 82 L 720 84"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="250"
          strokeDashoffset="250"
          style={{
            animation: `stroke-draw-letter 1s ease-out ${text.length * 0.1}s forwards`
          }}
        />
      </svg>
    </div>
  );
};
