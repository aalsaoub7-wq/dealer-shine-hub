import { useEffect, useState } from "react";

export const HandwrittenText = () => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationComplete(true);
    }, 4000); // Animation completes after 4s (3s text + 1s underline)

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
        
        {/* Main text with stroke animation */}
        <text
          x="10"
          y="70"
          className="handwritten-text"
          stroke="currentColor"
          strokeWidth="2.5"
          fill={animationComplete ? "currentColor" : "none"}
          strokeDasharray="1500"
          strokeDashoffset="0"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            animation: "stroke-draw 3s ease-out forwards",
            color: "hsl(var(--foreground))"
          }}
        >
          bilfoton på sekunder
        </text>

        {/* Hand-drawn underline under "sekunder" */}
        <path
          d="M 480 85 Q 500 88 520 84 T 560 87 T 600 83 T 640 86 T 680 82 L 720 84"
          stroke="hsl(var(--primary))"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="250"
          strokeDashoffset="0"
          style={{
            animation: "stroke-draw 1s ease-out 3s forwards"
          }}
        />
      </svg>
    </div>
  );
};
