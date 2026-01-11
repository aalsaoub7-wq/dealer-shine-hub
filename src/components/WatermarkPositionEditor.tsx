import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Check } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface WatermarkPositionEditorProps {
  imageUrl: string;
  logoUrl: string;
  initialXPercent: number;
  initialYPercent: number;
  initialSize: number;
  opacity: number;
  onSave: (xPercent: number, yPercent: number, size: number) => void;
  onCancel: () => void;
  saving?: boolean;
}

export const WatermarkPositionEditor = ({
  imageUrl,
  logoUrl,
  initialXPercent,
  initialYPercent,
  initialSize,
  opacity,
  onSave,
  onCancel,
  saving = false,
}: WatermarkPositionEditorProps) => {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const logoRef = useRef<HTMLImageElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Store canvas dimensions
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 0, height: 0 });
  
  // Local state in percentages
  const [xPercent, setXPercent] = useState(initialXPercent);
  const [yPercent, setYPercent] = useState(initialYPercent);
  const [sizePercent, setSizePercent] = useState(initialSize);
  const [logoSize, setLogoSize] = useState({ width: 0, height: 0 });

  // Load images once
  useEffect(() => {
    let loadedCount = 0;
    const checkLoaded = () => {
      loadedCount++;
      if (loadedCount === 2) {
        setImagesLoaded(true);
        if (imageRef.current) {
          setCanvasDimensions({
            width: imageRef.current.width,
            height: imageRef.current.height,
          });
        }
      }
    };

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageRef.current = img;
      checkLoaded();
    };
    img.onerror = () => console.error("Failed to load image");

    const logo = new Image();
    logo.crossOrigin = 'anonymous';
    logo.src = logoUrl;
    logo.onload = () => {
      logoRef.current = logo;
      checkLoaded();
    };
    logo.onerror = () => console.error("Failed to load logo");

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageUrl, logoUrl]);

  // Render canvas
  const renderCanvas = useCallback(() => {
    if (!canvasRef.current || !imageRef.current || !logoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imgWidth = imageRef.current.width;
    const imgHeight = imageRef.current.height;

    // Set canvas size to match image
    if (canvas.width !== imgWidth || canvas.height !== imgHeight) {
      canvas.width = imgWidth;
      canvas.height = imgHeight;
    }

    // Clear and draw background image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(imageRef.current, 0, 0);

    // Calculate logo dimensions
    const logoMaxWidth = canvas.width * (sizePercent / 100);
    const logoScale = logoMaxWidth / logoRef.current.width;
    const logoWidth = logoRef.current.width * logoScale;
    const logoHeight = logoRef.current.height * logoScale;
    
    setLogoSize({ width: logoWidth, height: logoHeight });

    // Calculate pixel positions from percentages
    const x = canvas.width * (xPercent / 100);
    const y = canvas.height * (yPercent / 100);

    // Draw logo with transparency
    ctx.globalAlpha = opacity;
    ctx.drawImage(logoRef.current, x, y, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;

    // Draw selection frame
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(4, canvas.width / 500);
    ctx.strokeRect(x, y, logoWidth, logoHeight);
    
    // Draw resize handle
    const handleSize = Math.max(20, canvas.width / 60);
    const handleX = x + logoWidth;
    const handleY = y + logoHeight;
    
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(handleX, handleY, handleSize, 0, 2 * Math.PI);
    ctx.stroke();
  }, [xPercent, yPercent, sizePercent, opacity, imagesLoaded]);

  // Trigger render when state changes
  useEffect(() => {
    if (!imagesLoaded) return;
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(renderCanvas);
  }, [renderCanvas, imagesLoaded]);

  const getMousePosition = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const { x: mouseX, y: mouseY } = getMousePosition(e);
    const canvas = canvasRef.current;
    
    const x = canvas.width * (xPercent / 100);
    const y = canvas.height * (yPercent / 100);
    
    const handleSize = Math.max(20, canvas.width / 60);
    const handleX = x + logoSize.width;
    const handleY = y + logoSize.height;
    
    // Check if click is on resize handle
    const distanceToHandle = Math.sqrt(
      Math.pow(mouseX - handleX, 2) + Math.pow(mouseY - handleY, 2)
    );
    
    if (distanceToHandle <= handleSize * 1.5) {
      setIsResizing(true);
      return;
    }

    // Check if click is within logo bounds
    if (mouseX >= x && mouseX <= x + logoSize.width && 
        mouseY >= y && mouseY <= y + logoSize.height) {
      setIsDragging(true);
      setDragOffset({ x: mouseX - x, y: mouseY - y });
    }
  }, [xPercent, yPercent, logoSize, getMousePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || (!isDragging && !isResizing)) return;

    const { x: mouseX, y: mouseY } = getMousePosition(e);
    const canvas = canvasRef.current;

    if (isResizing && logoRef.current) {
      const x = canvas.width * (xPercent / 100);
      const y = canvas.height * (yPercent / 100);
      
      const dx = Math.max(1, mouseX - x);
      const dy = Math.max(1, mouseY - y);
      const ar = logoRef.current.height / logoRef.current.width;

      let width = dx;
      let height = width * ar;
      if (height > dy) {
        height = dy;
        width = height / ar;
      }

      const newSize = (width / canvas.width) * 100;
      setSizePercent(Math.max(1, Math.min(100, newSize)));
      return;
    }

    if (isDragging) {
      const newX = mouseX - dragOffset.x;
      const newY = mouseY - dragOffset.y;
      setXPercent((newX / canvas.width) * 100);
      setYPercent((newY / canvas.height) * 100);
    }
  }, [isDragging, isResizing, xPercent, yPercent, dragOffset, getMousePosition]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  const handleSave = () => {
    onSave(xPercent, yPercent, sizePercent);
  };

  if (!imagesLoaded) {
    return (
      <div className="fixed inset-0 z-50 bg-background/95 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4 mx-auto"></div>
          <p className="text-muted-foreground">Laddar bild...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <h2 className="text-lg font-semibold">Justera vattenmärkets position</h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={onCancel} disabled={saving}>
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Canvas area */}
      <div className="flex-1 overflow-auto p-4 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full object-contain cursor-move touch-none shadow-lg rounded-lg"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const syntheticEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
            handleMouseDown(syntheticEvent);
          }}
          onTouchMove={(e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const syntheticEvent = { clientX: touch.clientX, clientY: touch.clientY } as React.MouseEvent<HTMLCanvasElement>;
            handleMouseMove(syntheticEvent);
          }}
          onTouchEnd={handleMouseUp}
          style={{ imageRendering: 'auto' }}
        />
      </div>

      {/* Footer with instructions and save button */}
      <div className="p-4 border-t bg-card">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            Dra vattenmärket för att flytta det. Dra i den röda pricken för att ändra storlek.
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel} disabled={saving}>
              Avbryt
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sparar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Spara
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
