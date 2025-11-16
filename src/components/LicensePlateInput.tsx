import { useEffect, useRef, useState } from "react";
import licensePlate from "@/assets/license-plate.png";

interface LicensePlateInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
}

const LicensePlateInput = ({ value, onChange, maxLength = 6 }: LicensePlateInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const formatValue = (val: string) => {
    const upper = val.toUpperCase();
    if (upper.length === 6) {
      return `${upper.slice(0, 3)} ${upper.slice(3)}`;
    }
    return upper;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative w-64 sm:w-80 cursor-text hover:scale-105 transition-transform duration-300"
        onClick={handleClick}
      >
        <img src={licensePlate} alt="Registreringsskylt" className="w-full h-auto" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-extrabold text-black text-3xl sm:text-4xl md:text-5xl tracking-wide ml-3 sm:ml-4"
            style={{ fontFamily: "monospace" }}
          >
            {formatValue(value)}
            {showCursor && (
              <span className="inline-block w-0.5 h-8 sm:h-10 md:h-12 bg-black ml-1 align-middle" />
            )}
          </span>
        </div>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        className="sr-only"
        autoFocus
      />
    </div>
  );
};

export default LicensePlateInput;
