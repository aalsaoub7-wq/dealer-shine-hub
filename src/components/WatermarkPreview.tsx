import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
  const [isResizing, setIsResizing] = useState(false);
  const [isSelected, setIsSelected] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [logoSize, setLogoSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!canvasRef.current || !logoUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const testImg = new Image();
    testImg.crossOrigin = 'anonymous';
    testImg.src = testImage;

    testImg.onload = () => {
      // Set canvas size to 3840x2880
      canvas.width = 3840;
      canvas.height = 2880;
      setCanvasSize({ width: 3840, height: 2880 });

      // Draw test image scaled to fit canvas
      ctx.drawImage(testImg, 0, 0, 3840, 2880);

      // Draw watermark
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.src = logoUrl;

      logo.onload = () => {
        // Calculate logo size
        const logoMaxWidth = canvas.width * (size / 100);
        const logoScale = logoMaxWidth / logo.width;
        const logoWidth = logo.width * logoScale;
        const logoHeight = logo.height * logoScale;
        
        setLogoSize({ width: logoWidth, height: logoHeight });

        // Draw logo with transparency
        ctx.globalAlpha = 0.8;
        ctx.drawImage(logo, x, y, logoWidth, logoHeight);
        ctx.globalAlpha = 1.0;

        // Draw selection frame if selected
        if (isSelected) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 4;
          ctx.strokeRect(x, y, logoWidth, logoHeight);
          
          // Draw resize handle (red circle in bottom-right corner)
          const handleSize = 20;
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(x + logoWidth, y + logoHeight, handleSize, 0, 2 * Math.PI);
          ctx.fill();
        }
      };
    };
  }, [logoUrl, x, y, size, isSelected]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    const handleSize = 20;
    const handleX = x + logoSize.width;
    const handleY = y + logoSize.height;
    
    // Check if click is on resize handle
    const distanceToHandle = Math.sqrt(
      Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2)
    );
    
    if (distanceToHandle <= handleSize && isSelected) {
      setIsResizing(true);
      return;
    }

    // Check if click is within logo bounds
    if (mouseX >= x && mouseX <= x + logoSize.width && 
        mouseY >= y && mouseY <= y + logoSize.height) {
      setIsSelected(true);
      setIsDragging(true);
      setDragOffset({ x: mouseX - x, y: mouseY - y });
    } else {
      setIsSelected(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mouseX = (e.clientX - rect.left) * scaleX;
    const mouseY = (e.clientY - rect.top) * scaleY;

    if (isResizing) {
      // Calculate new size based on distance from logo position
      const deltaX = mouseX - x;
      const deltaY = mouseY - y;
      const diagonal = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Convert diagonal to size percentage
      const newSize = (diagonal / canvas.width) * 100;
      onSizeChange(Math.max(1, Math.min(200, newSize)));
      return;
    }

    if (isDragging) {
      // Allow free positioning anywhere on canvas
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      onPositionChange(newX, newY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
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
          Klicka på vattenmärket för att välja det. Dra för att flytta, dra den röda pricken för att ändra storlek.
        </p>
        <Card className="p-4 bg-secondary">
          <canvas
            ref={canvasRef}
            className="w-full h-auto cursor-move"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
        </Card>
      </div>
    </div>
  );
};
