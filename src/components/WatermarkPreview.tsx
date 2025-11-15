import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import testImage from "@/assets/watermark-test.jpg";

interface WatermarkPreviewProps {
  logoUrl: string;
  x: number;
  y: number;
  size: number;
  onPositionChange: (x: number, y: number) => void;
  onSizeChange: (size: number) => void;
}

export const WatermarkPreview = ({
  logoUrl,
  x,
  y,
  size,
  onPositionChange,
  onSizeChange,
}: WatermarkPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!canvasRef.current || !logoUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.src = testImage;

    testImg.onload = () => {
      // Set canvas size to match image
      canvas.width = testImg.width;
      canvas.height = testImg.height;
      setCanvasSize({ width: testImg.width, height: testImg.height });

      // Draw test image
      ctx.drawImage(testImg, 0, 0);

      // Draw watermark
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = logoUrl;

      logo.onload = () => {
        // Calculate logo size
        const logoMaxWidth = testImg.width * (size / 100);
        const logoScale = logoMaxWidth / logo.width;
        const logoWidth = logo.width * logoScale;
        const logoHeight = logo.height * logoScale;

        // Draw logo with transparency
        ctx.globalAlpha = 0.8;
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;
      };
    };
  }, [logoUrl, x, y, size]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Calculate logo dimensions
    const logoMaxWidth = canvas.width * (size / 100);
    const logoWidth = logoMaxWidth;
    const logoHeight = logoMaxWidth; // Approximate, will be adjusted by aspect ratio

    // Check if click is within logo bounds
    if (mouseX >= x && mouseX <= x + logoWidth && mouseY >= y && mouseY <= y + logoHeight) {
      setIsDragging(true);
      setDragOffset({ x: mouseX - x, y: mouseY - y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    // Calculate new position
    const newX = Math.max(0, Math.min(canvas.width - (canvas.width * size / 100), mouseX - dragOffset.x));
    const newY = Math.max(0, Math.min(canvas.height - (canvas.height * size / 100), mouseY - dragOffset.y));

    onPositionChange(newX, newY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!logoUrl) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        Ladda upp en logotyp först för att se förhandsvisning
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-2 block">Förhandsvisning</Label>
        <p className="text-sm text-muted-foreground mb-2">
          Dra vattenmärket för att placera det där du vill
        </p>
        <Card className="p-4 bg-secondary">
          <canvas
            ref={canvasRef}
            className="w-full h-auto rounded-lg cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </Card>
      </div>

      <div>
        <Label className="mb-2 block">Storlek ({size}%)</Label>
        <Slider
          value={[size]}
          onValueChange={(values) => onSizeChange(values[0])}
          min={5}
          max={30}
          step={1}
          className="w-full"
        />
      </div>
    </div>
  );
};
